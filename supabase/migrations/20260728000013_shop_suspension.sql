-- ============================================================
-- 20260728000013_shop_suspension.sql
-- El superadmin necesita poder suspender un comercio (deja de
-- verse en el feed y en su ficha pública). La columna
-- shops.is_active ya existe y ya filtra en get_products_feed y
-- getShopBySlug, pero nunca se usaba desde el panel de
-- superadmin y no estaba protegida: un shop_admin podía
-- reactivarse solo vía UPDATE directo. Se agrega
-- suspended_reason para dejar registro del motivo, y se suma
-- is_active al trigger que ya protege verification_status/
-- subscription_status.
-- ============================================================
alter table public.shops
  add column if not exists suspended_reason text null;

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
    new.is_active := old.is_active;
    new.suspended_reason := old.suspended_reason;
  end if;
  return new;
end;
$$;

create or replace function public.suspend_shop(p_shop_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede suspender un comercio';
  end if;

  update public.shops
  set is_active = false,
      suspended_reason = p_reason,
      updated_at = now()
  where id = p_shop_id;
end;
$$;

create or replace function public.unsuspend_shop(p_shop_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede reactivar un comercio';
  end if;

  update public.shops
  set is_active = true,
      suspended_reason = null,
      updated_at = now()
  where id = p_shop_id;
end;
$$;

revoke all on function public.suspend_shop(uuid, text) from public;
revoke all on function public.unsuspend_shop(uuid) from public;
grant execute on function public.suspend_shop(uuid, text) to authenticated;
grant execute on function public.unsuspend_shop(uuid) to authenticated;
