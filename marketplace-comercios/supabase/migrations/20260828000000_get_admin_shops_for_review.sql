-- getShopsForReview traía subscriptions+subscription_plans y products(count)
-- anidados por cada shop, más shop_reports sin límite en una query aparte, y
-- calculaba el plan activo y el conteo de reportes abiertos por comercio en
-- JS. Esta función arma esa misma info con joins laterales + agregados en
-- SQL, así solo viaja el resultado plano por la red.

CREATE OR REPLACE FUNCTION "public"."get_admin_shops_for_review"(
  "p_limit" integer DEFAULT 200
)
RETURNS TABLE(
  "id" "uuid",
  "name" "text",
  "city" "text",
  "whatsapp_number" "text",
  "verification_status" "public"."verification_status",
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "is_active" boolean,
  "logo_url" "text",
  "active_plan_name" "text",
  "product_count" bigint,
  "open_reports_count" bigint
)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  if p_limit > 200 then
    p_limit := 200;
  elsif p_limit < 1 then
    p_limit := 1;
  end if;

  return query
  select
    s.id,
    s.name,
    s.city,
    s.whatsapp_number,
    s.verification_status,
    s.created_at,
    s.updated_at,
    s.is_active,
    s.logo_url,
    plan.name,
    coalesce(prod.product_count, 0),
    coalesce(reports.open_reports_count, 0)
  from public.shops s
  left join lateral (
    select sp.name
    from public.subscriptions sub
    join public.subscription_plans sp on sp.id = sub.plan_id
    where sub.shop_id = s.id
      and sub.status = 'active'
    order by sub.created_at desc
    limit 1
  ) plan on true
  left join lateral (
    select count(*) as product_count
    from public.products p
    where p.shop_id = s.id
  ) prod on true
  left join lateral (
    select count(*) as open_reports_count
    from public.shop_reports sr
    where sr.shop_id = s.id
      and sr.status = 'pending'
  ) reports on true
  where s.deleted_at is null
  order by s.created_at desc
  limit p_limit;
end;
$$;

ALTER FUNCTION "public"."get_admin_shops_for_review"("p_limit" integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_admin_shops_for_review"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_shops_for_review"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_shops_for_review"("p_limit" integer) TO "service_role";
