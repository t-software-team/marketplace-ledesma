-- ============================================================
-- 20260728000002_reject_rpcs.sql
-- approve_shop_verification/approve_subscription pasan por RPC
-- security definer, pero sus contrapartes de rechazo hacían un
-- UPDATE directo desde el Server Action del superadmin. AGENTS.md
-- exige que TODO cambio a verification_status/subscription_status
-- pase por una RPC security definer que valide is_superadmin()
-- adentro, no solo confiar en la policy/route de superadmin.
-- ============================================================

create or replace function public.reject_shop_verification(
  p_shop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede rechazar la verificación de un comercio';
  end if;

  update public.shops
  set verification_status = 'rejected',
      updated_at = now()
  where id = p_shop_id;
end;
$$;

create or replace function public.reject_subscription(
  p_subscription_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede rechazar suscripciones';
  end if;

  update public.subscriptions
  set status = 'rejected',
      rejection_reason = p_reason
  where id = p_subscription_id;
end;
$$;
