-- ============================================================
-- 20260727000005_add_set_shop_location_rpc.sql
-- RPC para setear shops.location (geography) de forma segura desde
-- el cliente sin exponer WKT/EWKT crudo vía PostgREST. La usa el
-- Server Action de configuración del shop tras geocodificar la
-- dirección con Nominatim.
-- ============================================================
create or replace function public.set_shop_location(
  p_shop_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shops
  set location = st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      updated_at = now()
  where id = p_shop_id
    and (owner_id = auth.uid() or public.is_superadmin());
end;
$$;
