-- Unifica el modelo de límites: en vez de las claves genéricas 'free'/'paid',
-- plan_limits pasa a tener una fila por plan_id real de subscription_plans.
-- Motivo: el negocio ya no tiene solo "free/paid" sino varios planes pagos
-- (básico, ilimitado, etc.) editables desde /admin/subscripciones; mantener
-- 'free'/'paid' como claves genéricas no representa eso y obligaba a
-- hardcodear el límite free (3/15) en el frontend (mi-tienda/page.tsx y
-- mi-tienda/suscripcion/page.tsx) en vez de leerlo de una fila real.
--
-- Diseño:
--   - plan_limits.plan_id referencia subscription_plans(id). NULL significa
--     "fila por defecto" (fallback histórico de la clave 'paid': se usa para
--     max_images/max_variants cuando el plan pago activo de un comercio no
--     trae su propia fila en plan_limits ni especifica esos valores en
--     benefits). Solo puede existir una fila con plan_id NULL (índice único
--     parcial más abajo).
--   - El plan gratuito no era una fila real en subscription_plans (no había
--     seed). Como el límite de productos gratuitos distingue rubro
--     servicio/producto (3 vs 15, ver freeMaxForShop hardcodeado), se siembran
--     DOS planes free reales: uno con applies_to='service' y otro con
--     applies_to='product', cada uno con su propia fila en plan_limits.
--   - Se elimina la columna genérica "plan" (text) ya sin uso.

DO $$
DECLARE
  v_free_service_id uuid;
  v_free_product_id uuid;
  v_old_free plan_limits%ROWTYPE;
  v_old_paid plan_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_old_free FROM public.plan_limits WHERE plan = 'free';
  SELECT * INTO v_old_paid FROM public.plan_limits WHERE plan = 'paid';

  -- Reusar una fila free real ya existente en subscription_plans si la hay
  -- (price = 0), o sembrarla si no existe.
  SELECT id INTO v_free_service_id
  FROM public.subscription_plans
  WHERE price = 0 AND applies_to IN ('service', 'all')
  ORDER BY applies_to = 'service' DESC
  LIMIT 1;

  IF v_free_service_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, description, price, duration_days, benefits, is_active, applies_to)
    VALUES (
      'Free',
      'Plan gratuito para comercios de servicios.',
      0,
      36500,
      jsonb_build_object('max_products', COALESCE(v_old_free.max_products_service, 3)),
      true,
      'service'
    )
    RETURNING id INTO v_free_service_id;
  END IF;

  SELECT id INTO v_free_product_id
  FROM public.subscription_plans
  WHERE price = 0 AND applies_to IN ('product', 'all')
  ORDER BY applies_to = 'product' DESC
  LIMIT 1;

  IF v_free_product_id IS NULL OR v_free_product_id = v_free_service_id THEN
    INSERT INTO public.subscription_plans (name, description, price, duration_days, benefits, is_active, applies_to)
    VALUES (
      'Free',
      'Plan gratuito para comercios de productos.',
      0,
      36500,
      jsonb_build_object('max_products', COALESCE(v_old_free.max_products_product, 15)),
      true,
      'product'
    )
    RETURNING id INTO v_free_product_id;
  END IF;

  -- Columna nueva.
  ALTER TABLE public.plan_limits ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE CASCADE;

  -- La columna vieja "plan" todavía es NOT NULL y parte de la PK en este
  -- punto; hay que soltar la PK antes de poder quitarle el NOT NULL, para
  -- poder insertar las filas nuevas (que ya no la usan) antes de dropearla
  -- del todo más abajo.
  ALTER TABLE public.plan_limits DROP CONSTRAINT IF EXISTS plan_limits_pkey;
  ALTER TABLE public.plan_limits ALTER COLUMN plan DROP NOT NULL;

  -- Filas free -> una por plan_id real.
  INSERT INTO public.plan_limits (plan_id, max_products_service, max_products_product, max_images, max_variants)
  VALUES (
    v_free_service_id,
    COALESCE(v_old_free.max_products_service, 3),
    NULL,
    COALESCE(v_old_free.max_images, 2),
    COALESCE(v_old_free.max_variants, 3)
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.plan_limits (plan_id, max_products_service, max_products_product, max_images, max_variants)
  VALUES (
    v_free_product_id,
    NULL,
    COALESCE(v_old_free.max_products_product, 15),
    COALESCE(v_old_free.max_images, 2),
    COALESCE(v_old_free.max_variants, 3)
  )
  ON CONFLICT DO NOTHING;

  -- Fila por defecto (antes 'paid'): plan_id NULL, fallback para planes
  -- pagos que no traen su propia fila ni especifican max_images/max_variants
  -- en benefits.
  INSERT INTO public.plan_limits (plan_id, max_products_service, max_products_product, max_images, max_variants)
  VALUES (
    NULL,
    v_old_paid.max_products_service,
    v_old_paid.max_products_product,
    COALESCE(v_old_paid.max_images, 5),
    COALESCE(v_old_paid.max_variants, 10)
  )
  ON CONFLICT DO NOTHING;

  -- Borrar las filas genéricas viejas.
  DELETE FROM public.plan_limits WHERE plan IN ('free', 'paid');
END $$;

-- A partir de acá, plan_id es la clave real; ya no hay filas con "plan" viejo.
ALTER TABLE public.plan_limits DROP CONSTRAINT IF EXISTS plan_limits_pkey;
ALTER TABLE public.plan_limits DROP CONSTRAINT IF EXISTS plan_limits_plan_check;
ALTER TABLE public.plan_limits DROP COLUMN IF EXISTS plan;

ALTER TABLE public.plan_limits ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.plan_limits ADD CONSTRAINT plan_limits_pkey PRIMARY KEY (id);

-- Un plan real solo puede tener una fila de límites.
CREATE UNIQUE INDEX IF NOT EXISTS plan_limits_plan_id_unique ON public.plan_limits (plan_id) WHERE plan_id IS NOT NULL;

-- Solo puede existir una fila "por defecto" (plan_id NULL).
CREATE UNIQUE INDEX IF NOT EXISTS plan_limits_default_unique ON public.plan_limits ((plan_id IS NULL)) WHERE plan_id IS NULL;

-- RLS sin cambios: lectura pública, escritura solo superadmin (las policies
-- ya creadas en 20260820000000_plan_limits.sql no referencian la columna
-- "plan" y siguen vigentes).
