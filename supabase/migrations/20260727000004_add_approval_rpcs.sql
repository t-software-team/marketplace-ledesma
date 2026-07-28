-- ============================================================
-- 20260727000004_add_approval_rpcs.sql
-- approve_shop_verification y approve_subscription nunca se habían
-- creado en remoto: el primer `db push` de este proyecto abortó en
-- el statement 5 (create type user_role) y Postgres revirtió toda
-- la transacción, incluidas estas dos funciones que estaban más
-- adelante en el archivo. Se detectó al implementar el panel de
-- superadmin (Sprint 5), que las necesita.
-- ============================================================

create or replace function public.approve_shop_verification(
  p_shop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede aprobar la verificación de un comercio';
  end if;

  update public.shops
  set verification_status = 'verified',
      verified_at = now(),
      verified_by = auth.uid(),
      updated_at = now()
  where id = p_shop_id;
end;
$$;

create or replace function public.approve_subscription(
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
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede aprobar suscripciones';
  end if;

  select s.shop_id, s.end_date
  into v_shop_id, v_end_date
  from public.subscriptions s
  where s.id = p_subscription_id;

  if v_shop_id is null then
    raise exception 'Suscripción no encontrada';
  end if;

  update public.subscriptions
  set status = 'active',
      approved_at = now(),
      approved_by = auth.uid()
  where id = p_subscription_id;

  update public.shops
  set subscription_status = 'active',
      subscription_expires_at = v_end_date,
      updated_at = now()
  where id = v_shop_id;
end;
$$;
