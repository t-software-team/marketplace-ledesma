-- ============================================================
-- supabase/tests/rls-manual-checks.sql
-- =========================================
-- Guía de ejecución:
--   1. Conectate a la instancia de Supabase (local o remota).
--   2. Ejecutar este archivo como usuario autenticado (o anon
--      si el cliente lo permite, según cada política).
--   3. Para cada test, verificar que el resultado coincida con
--      la línea "ESPERADO".
--
-- IMPORTANTE: Para los tests que requieren set_config de role,
-- usar pg_dump --no-owner o ejecutar desde la CLI de Supabase
-- con el rol correspondiente.
-- ============================================================

-- ============================================================
-- ANON (usuario no autenticado)
-- ============================================================
-- ESPERADO: OK — SELECT retorna filas (shops activas visibles)
SELECT id, name, slug FROM public.shops
WHERE is_active = true AND is_paused = false AND deleted_at IS NULL
LIMIT 5;

-- ESPERADO: 0 filas o ERROR — anon no puede INSERT en profiles
INSERT INTO public.profiles (id, full_name, role)
VALUES ('test-anon', 'Test', 'client');

-- ============================================================
-- AUTHENTICATED / CLIENT
-- ============================================================
-- ESPERADO: OK — client ve su propio perfil
SELECT id, full_name, phone, role FROM public.profiles
WHERE id = auth.uid();

-- ESPERADO: OK — client ve shops activas no pausadas
SELECT id, name, slug FROM public.products p
JOIN public.shops s ON s.id = p.shop_id
WHERE p.is_active = true AND s.is_active = true AND s.is_paused = false;

-- ESPERADO: OK — client puede INSERTAR su propio favorito
INSERT INTO public.favorites (client_id, product_id)
VALUES (auth.uid(), '44444444-4444-4444-4444-444444444444')
ON CONFLICT (client_id, product_id) DO NOTHING;

-- ESPERADO: OK — client ve sus favoritos
SELECT * FROM public.favorites WHERE client_id = auth.uid();

-- ESPERADO: 0 filas (ERROR) — client NO puede UPDATE shops
UPDATE public.shops SET name = 'Modificado por cliente' WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: 0 filas (ERROR) — client NO puede INSERTAR shops
INSERT INTO public.shops (owner_id, name, slug, whatsapp_number)
VALUES (auth.uid(), 'Shop del cliente', 'shop-cliente', '+5491100000000');

-- ============================================================
-- AUTHENTICATED / SHOP_ADMIN
-- ============================================================
-- ESPERADO: OK — shop_admin ve su propia shop
SELECT id, name, verification_status, subscription_status, is_paused
FROM public.shops WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK — shop_admin puede UPDATE columnas permitidas (name, description, etc.)
UPDATE public.shops
SET name = 'Comercio Test Actualizado',
    description = 'Descripción actualizada por shop_admin',
    address = 'Nueva Dirección 456',
    city = 'Buenos Aires',
    instagram_url = 'https://instagram.com/comercioactualizado'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
AND owner_id = auth.uid();

-- ESPERADO: 0 filas — shop_admin NO puede UPDATE verification_status (columna sensible)
UPDATE public.shops
SET verification_status = 'verified',
    verified_at = now(),
    verified_by = auth.uid()
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: 0 filas — shop_admin NO puede UPDATE subscription_status (columna sensible)
UPDATE public.shops
SET subscription_status = 'active',
    subscription_expires_at = now() + interval '30 days'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: 0 filas — shop_admin NO puede UPDATE is_paused (columna sensible)
UPDATE public.shops
SET is_paused = true, paused_reason = 'Test'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK (1 fila) — shop_admin puede UPDATE is_active (columna permitida)
UPDATE public.shops
SET is_active = false
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
AND owner_id = auth.uid();

-- ESPERADO: 0 filas — shop_admin NO puede DELETE shops
DELETE FROM public.shops WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK — shop_admin puede INSERT productos en su shop
INSERT INTO public.products (name, description, price, currency, shop_id, category_id, is_active)
VALUES ('Producto Test Shop Admin', 'Producto creado por shop_admin', 5000, 'ARS',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- ============================================================
-- AUTHENTICATED / SUPERADMIN
-- ============================================================
-- ESPERADO: OK — superadmin ve todas las shops (incluyendo pausadas)
SELECT id, name, is_paused, deleted_at
FROM public.shops
WHERE is_paused = true OR deleted_at IS NOT NULL;

-- ESPERADO: OK — superadmin puede UPDATE cualquier columna (incluidas sensibles)
UPDATE public.shops
SET verification_status = 'verified',
    verified_at = now(),
    verified_by = auth.uid()
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK — superadmin puede cambiar subscription_status
UPDATE public.shops
SET subscription_status = 'active',
    subscription_expires_at = now() + interval '30 days'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK — superadmin puede pausar/desactivar shops
UPDATE public.shops
SET is_paused = true, paused_reason = 'Superadmin test'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK — superadmin puede DELETE shops
DELETE FROM public.shops WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ============================================================
-- Tests de RPCs
-- ============================================================

-- ESPERADO: OK — get_products_feed retorna products de shops activas
SELECT COUNT(*) AS total_products
FROM public.get_products_feed(p_limit => 10);

-- ESPERADO: 0 filas — get_products_feed NO retorna products de shops is_paused = true
SELECT COUNT(*) AS paused_shop_products
FROM public.get_products_feed(p_limit => 100)
WHERE shop_id IN (
  SELECT id FROM public.shops WHERE is_paused = true
);

-- ESPERADO: OK — increment_shop_metric actualiza perfil_views
SELECT public.increment_shop_metric('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'profile_views');
SELECT profile_views FROM public.shops WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: OK — increment_shop_metric actualiza whatsapp_clicks
SELECT public.increment_shop_metric('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'whatsapp_clicks');
SELECT whatsapp_clicks FROM public.shops WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: true — is_superadmin retorna true para superadmin
SELECT public.is_superadmin();

-- ESPERADO: OK — approve_shop_verification (solo superadmin)
SELECT public.approve_shop_verification('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
SELECT verification_status FROM public.shops WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ESPERADO: 0 filas (ERROR) — approve_shop_verification falla para no-superadmin
-- (requiere ejecutar el test como client o shop_admin)
-- SELECT public.approve_shop_verification('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- ESPERADO: OK — approve_subscription (solo superadmin)
SELECT public.approve_subscription('33333333-3333-3333-3333-333333333333');
SELECT status FROM public.subscriptions WHERE id = '33333333-3333-3333-3333-333333333333';

-- ============================================================
-- Tests de storage (requieren ejecutar en el contexto de Storage API)
-- ============================================================
-- ESPERADO: OK — El owner de la shop puede upload a shop-logos
-- path: shops/{shop_id}/logo.png → verificado por storage_is_owner()

-- ESPERADO: 0 filas (ERROR) — Otro usuario NO puede upload a shop-logos de otra shop
-- path: shops/{otro_shop_id}/logo.png → denegado por storage_is_owner()

-- ============================================================
-- Tests adicionales de RLS
-- ============================================================

-- ESPERADO: OK — shop_admin ve solo sus propias suscripciones
SELECT s.id, s.status
FROM public.subscriptions s
JOIN public.shops sh ON sh.id = s.shop_id
WHERE sh.owner_id = auth.uid();

-- ESPERADO: 0 filas — shop_admin NO ve suscripciones de otros shops
SELECT s.id FROM public.subscriptions s
JOIN public.shops sh ON sh.id = s.shop_id
WHERE sh.owner_id != auth.uid();

-- ESPERADO: OK — reportero ve sus propios reportes
INSERT INTO public.shop_reports (shop_id, reported_by, reason, status)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', auth.uid(), 'scam', 'pending');

-- ESPERADO: OK — superadmin ve todos los reportes
SELECT * FROM public.shop_reports WHERE status = 'pending';

-- ESPERADO: OK — get_products_feed con búsqueda de texto retorna resultados
SELECT product_name, shop_name, price
FROM public.get_products_feed(p_search => 'Farmacia', p_limit => 10);

-- ESPERADO: OK — get_products_feed con filtro de categoría retorna resultados
SELECT product_name, product_id
FROM public.get_products_feed(p_category_id => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', p_limit => 10);