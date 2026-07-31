-- ============================================================
-- 20260731000002_exclude_owner_shop_metrics.sql
-- increment_shop_metric contaba las vistas/clicks del propio
-- dueño cuando entraba a ver su tienda pública (ej. "Ver cómo
-- queda" en /mi-tienda/personalizar), inflando profile_views /
-- whatsapp_clicks. Se descarta el registro si auth.uid() coincide
-- con el owner_id del shop.
-- ============================================================

create or replace function public.increment_shop_metric(
  p_shop_id uuid,
  p_metric text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  v_allowed boolean;
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.shops where id = p_shop_id;

  if v_owner_id is not null and v_owner_id = auth.uid() then
    return;
  end if;

  v_ip := coalesce(
    nullif(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), ''),
    'unknown'
  );

  v_allowed := public.check_rate_limit('ip:' || v_ip, 'metric:' || p_metric || ':' || p_shop_id::text, 1, 15);

  if not v_allowed then
    return;
  end if;

  if p_metric = 'view' then
    update public.shops
    set profile_views = profile_views + 1,
        updated_at = now()
    where id = p_shop_id;
  elsif p_metric = 'whatsapp_click' then
    update public.shops
    set whatsapp_clicks = whatsapp_clicks + 1,
        updated_at = now()
    where id = p_shop_id;
  end if;
end;
$$;
