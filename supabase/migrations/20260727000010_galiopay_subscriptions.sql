-- ============================================================
-- 20260727000010_galiopay_subscriptions.sql
-- Integración de pagos GalioPay para compra de planes de
-- suscripción (no productos). Guarda los datos del payment link
-- en la propia fila de subscriptions para poder retomar un pago
-- abandonado sin crear uno nuevo, y agrega una RPC de activación
-- exclusiva para el webhook (service_role), separada de
-- approve_subscription (que es para aprobación manual del
-- superadmin).
-- ============================================================

alter table public.subscriptions
  add column if not exists galiopay_reference_id text,
  add column if not exists galiopay_link_id text,
  add column if not exists galiopay_proof_token text,
  add column if not exists galiopay_checkout_url text,
  add column if not exists galiopay_status text;

create unique index if not exists idx_subscriptions_galiopay_reference
  on public.subscriptions (galiopay_reference_id)
  where galiopay_reference_id is not null;

-- Activación automática por webhook/self-heal, verificada contra la
-- API de GalioPay del lado server (no confía en el body del webhook
-- por sí solo). Solo invocable con service_role, nunca desde el
-- cliente ni con la sesión de un usuario autenticado normal.
create or replace function public.approve_subscription_by_payment(
  p_subscription_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_end_date timestamptz;
  v_status text;
begin
  select shop_id, end_date, status
  into v_shop_id, v_end_date, v_status
  from public.subscriptions
  where id = p_subscription_id;

  if v_shop_id is null then
    raise exception 'Suscripción no encontrada';
  end if;

  if v_status = 'active' then
    return;
  end if;

  update public.subscriptions
  set status = 'active',
      approved_at = now(),
      galiopay_status = 'approved'
  where id = p_subscription_id;

  update public.shops
  set subscription_status = 'active',
      subscription_expires_at = v_end_date,
      updated_at = now()
  where id = v_shop_id;
end;
$$;

revoke all on function public.approve_subscription_by_payment(uuid) from public, authenticated, anon;
grant execute on function public.approve_subscription_by_payment(uuid) to service_role;
