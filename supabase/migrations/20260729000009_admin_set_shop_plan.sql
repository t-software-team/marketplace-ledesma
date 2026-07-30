-- Lets a superadmin directly set (or clear) a shop's active plan from the
-- admin panel, instead of only being able to approve a pending request the
-- shop itself created.

create or replace function public.admin_set_shop_plan(p_shop_id uuid, p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_days integer;
  v_end_date timestamptz;
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede cambiar el plan de un comercio';
  end if;

  update public.subscriptions
  set status = 'expired'
  where shop_id = p_shop_id
    and status = 'active';

  if p_plan_id is null then
    update public.shops
    set subscription_status = 'none',
        subscription_expires_at = null,
        updated_at = now()
    where id = p_shop_id;
    return;
  end if;

  select duration_days into v_duration_days
  from public.subscription_plans
  where id = p_plan_id;

  if v_duration_days is null then
    raise exception 'Plan no encontrado';
  end if;

  v_end_date := now() + (v_duration_days || ' days')::interval;

  insert into public.subscriptions (shop_id, plan_id, status, start_date, end_date, approved_at, approved_by)
  values (p_shop_id, p_plan_id, 'active', now(), v_end_date, now(), auth.uid());

  update public.shops
  set subscription_status = 'active',
      subscription_expires_at = v_end_date,
      updated_at = now()
  where id = p_shop_id;
end;
$$;
