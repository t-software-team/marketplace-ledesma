-- Agrega filtro opcional de rubro (p_category_id) a get_featured_shops,
-- usado por la pantalla /comercios. Mismo cuerpo/orden que la versión
-- vigente en 20260823000000_get_featured_shops.sql, solo se suma una
-- condición al WHERE.

CREATE OR REPLACE FUNCTION "public"."get_featured_shops"(
  "p_limit" integer DEFAULT 12,
  "p_offset" integer DEFAULT 0,
  "p_category_id" "uuid" DEFAULT NULL
)
RETURNS TABLE(
  "id" "uuid",
  "name" "text",
  "slug" "text",
  "logo_url" "text",
  "city" "text",
  "category_id" "uuid",
  "verification_status" "public"."verification_status",
  "subscription_status" "public"."subscription_status",
  "avg_rating" numeric,
  "review_count" bigint
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if p_limit > 100 then
    p_limit := 100;
  elsif p_limit < 1 then
    p_limit := 1;
  end if;

  return query
  select
    s.id,
    s.name,
    s.slug,
    s.logo_url,
    s.city,
    s.category_id,
    s.verification_status,
    s.subscription_status,
    rating.avg_rating,
    rating.review_count
  from public.shops s
  left join lateral (
    select avg(sr.rating) as avg_rating, count(*) as review_count
    from public.shop_reviews sr
    where sr.shop_id = s.id
  ) rating on true
  -- Precio del plan de la suscripción activa más reciente del comercio, para
  -- que un plan más caro (ilimitado) rankee por encima de uno más barato
  -- (básico), antes de mirar el rating.
  left join lateral (
    select sp.price
    from public.subscriptions sub
    join public.subscription_plans sp on sp.id = sub.plan_id
    where sub.shop_id = s.id
      and sub.status = 'active'
    order by sub.created_at desc
    limit 1
  ) plan on true
  where s.is_active = true
    and s.is_paused = false
    and s.deleted_at is null
    and (p_category_id is null or s.category_id = p_category_id)
  order by
    -- No usar shops.subscription_status = 'active' solo: admin_set_shop_plan
    -- lo pone en 'active' para CUALQUIER plan asignado, incluidos los planes
    -- free (price = 0) sembrados como filas reales de subscription_plans.
    -- El criterio real de "es pago" es que el plan de la suscripción activa
    -- tenga precio > 0.
    (plan.price is not null and plan.price > 0) desc,
    plan.price desc nulls last,
    -- El rating solo pesa en el orden con 3+ reseñas (mismo umbral que
    -- get_products_feed), para que un comercio con una sola reseña de 5
    -- estrellas no le gane a uno con 50 reseñas y 4.8.
    case when rating.review_count >= 3 then rating.avg_rating end desc nulls last,
    s.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

ALTER FUNCTION "public"."get_featured_shops"("p_limit" integer, "p_offset" integer, "p_category_id" "uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_featured_shops"("p_limit" integer, "p_offset" integer, "p_category_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_featured_shops"("p_limit" integer, "p_offset" integer, "p_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_featured_shops"("p_limit" integer, "p_offset" integer, "p_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_featured_shops"("p_limit" integer, "p_offset" integer, "p_category_id" "uuid") TO "service_role";
