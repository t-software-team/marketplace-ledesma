-- ============================================================
-- 20260728000001_protect_shop_admin_columns.sql
-- La policy "shop admin edita su propio shop" es a nivel de fila
-- (owner_id = auth.uid() OR is_superadmin()), no de columna: un
-- shop_admin podía en teoría hacer un UPDATE directo desde el
-- cliente y tocar verification_status/subscription_status de su
-- propio shop, columnas que solo deberían cambiar vía las RPCs
-- security definer (approve_shop_verification, approve_subscription)
-- o el rechazo del superadmin. Se cierra con un trigger BEFORE
-- UPDATE que revierte esas columnas si quien actualiza no es
-- superadmin (opción 1 del doc de arquitectura, sección 5).
-- ============================================================
create or replace function public.protect_shop_admin_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists trg_protect_shop_admin_columns on public.shops;
create trigger trg_protect_shop_admin_columns
  before update on public.shops
  for each row execute procedure public.protect_shop_admin_columns();
