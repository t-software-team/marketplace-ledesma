-- ============================================================
-- 20260728000012_increment_shop_metric_rate_limit.sql
-- increment_shop_metric se llama directo desde el navegador
-- (anon), sin pasar por un Server Action — no hay forma de
-- envolverla con checkRateLimit desde TS. Se le agrega el mismo
-- límite pero resuelto adentro de la función, usando la IP que
-- PostgREST expone vía el GUC request.headers.
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
begin
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
