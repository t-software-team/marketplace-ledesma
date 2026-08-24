-- El dashboard de admin traía TODAS las filas de subscriptions (con join a
-- subscription_plans, sin filtro ni límite) y calculaba conteos/sumas de
-- revenue en JavaScript. Esta función mueve esa agregación a SQL: solo viaja
-- por la red el resultado final (unos pocos números), no cada fila de
-- subscriptions, y la suma/agrupación la hace Postgres con SUM/GROUP BY en
-- vez de un reduce en el server de Next.js.

CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_stats"()
RETURNS TABLE(
  "total_shops" bigint,
  "new_shops" bigint,
  "verified_shops" bigint,
  "paused_shops" bigint,
  "active_products" bigint,
  "pending_reports" bigint,
  "pending_suggestions" bigint,
  "pending_verifications_over_48h" bigint,
  "active_subscriptions_count" bigint,
  "pending_subscriptions_count" bigint,
  "total_revenue" numeric,
  "revenue_by_plan" jsonb
)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  thirty_days_ago timestamptz := now() - interval '30 days';
  forty_eight_hours_ago timestamptz := now() - interval '48 hours';
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  return query
  select
    (select count(*) from public.shops where deleted_at is null),
    (select count(*) from public.shops where deleted_at is null and created_at >= thirty_days_ago),
    (select count(*) from public.shops where verification_status = 'verified' and deleted_at is null),
    (select count(*) from public.shops where is_paused = true and deleted_at is null),
    (select count(*) from public.products where is_active = true),
    (select count(*) from public.shop_reports where status = 'pending'),
    (select count(*) from public.category_suggestions where status = 'pending'),
    (
      select count(*) from public.shops
      where verification_status = 'pending'
        and deleted_at is null
        and created_at <= forty_eight_hours_ago
    ),
    (select count(*) from public.subscriptions where status = 'active'),
    (select count(*) from public.subscriptions where status = 'pending'),
    (
      select coalesce(sum(sp.price), 0)
      from public.subscriptions sub
      join public.subscription_plans sp on sp.id = sub.plan_id
      where sub.status in ('active', 'expired')
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object('name', plan_name, 'revenue', revenue)), '[]'::jsonb)
      from (
        select
          coalesce(sp.name, 'Sin plan') as plan_name,
          sum(sp.price) as revenue
        from public.subscriptions sub
        left join public.subscription_plans sp on sp.id = sub.plan_id
        where sub.status in ('active', 'expired')
        group by coalesce(sp.name, 'Sin plan')
      ) by_plan
    );
end;
$$;

ALTER FUNCTION "public"."get_admin_dashboard_stats"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_admin_dashboard_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "service_role";
