-- ============================================================
-- 20260728000002_fix_protect_shop_admin_columns_service_role.sql
-- protect_shop_admin_columns() revertía verification_status/
-- subscription_status incluso cuando el UPDATE venía de las RPCs
-- de confianza (approve_subscription_by_payment, approve_subscription,
-- approve_shop_verification, reject_*), porque esas corren desde el
-- service role del servidor (sin auth.uid()), y is_superadmin()
-- da false para ese caso. El trigger debe dejar pasar los cambios
-- cuando el rol de sesión es service_role — esas RPCs ya están
-- revocadas para public/authenticated/anon, solo el server confía en
-- ellas, así que confiar en el rol de sesión acá es seguro.
-- ============================================================
create or replace function public.protect_shop_admin_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_superadmin() then
    new.verification_status := old.verification_status;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
    new.subscription_status := old.subscription_status;
    new.subscription_expires_at := old.subscription_expires_at;
  end if;
  return new;
end;
$$;
