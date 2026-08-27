-- Recompute get_gym_dashboard_stats in Argentina's timezone.
--
-- The original used current_date / date_trunc('month', now()), which the DB
-- evaluates in UTC. After 21:00 local (UTC-3) "today" jumps to tomorrow, so
-- expiring_soon and the month boundaries were off. All date logic now derives
-- from America/Argentina/Buenos_Aires, matching the app-side timezone helper.
create or replace function public.get_gym_dashboard_stats(p_shop_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_result jsonb;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_month_start timestamptz :=
    date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')
      at time zone 'America/Argentina/Buenos_Aires';
begin
  if not exists (
    select 1 from public.shops s
    where s.id = p_shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ) then
    raise exception 'not authorized for shop %', p_shop_id using errcode = '42501';
  end if;

  select jsonb_build_object(
    'active_members', (
      select count(distinct m.id)
      from public.gym_members m
      where m.shop_id = p_shop_id
        and m.is_archived = false
        and exists (
          select 1 from public.gym_memberships ms
          where ms.member_id = m.id and ms.expires_at >= v_today
        )
    ),
    'expired_members', (
      select count(*)
      from public.gym_members m
      where m.shop_id = p_shop_id
        and m.is_archived = false
        and not exists (
          select 1 from public.gym_memberships ms
          where ms.member_id = m.id and ms.expires_at >= v_today
        )
    ),
    'archived_members', (
      select count(*)
      from public.gym_members m
      where m.shop_id = p_shop_id and m.is_archived = true
    ),
    'new_members_month', (
      select count(*)
      from public.gym_members m
      where m.shop_id = p_shop_id
        and m.created_at >= v_month_start
    ),
    'expiring_soon', (
      select count(distinct ms.member_id)
      from public.gym_memberships ms
      join public.gym_members m on m.id = ms.member_id and m.is_archived = false
      where ms.shop_id = p_shop_id
        and ms.expires_at >= v_today
        and ms.expires_at < v_today + 7
    ),
    'revenue_month_cash', (
      select coalesce(sum(p.amount), 0)
      from public.gym_payments p
      where p.shop_id = p_shop_id
        and p.status = 'paid'
        and p.method = 'cash'
        and p.paid_at >= v_month_start
    ),
    'revenue_month_transfer', (
      select coalesce(sum(p.amount), 0)
      from public.gym_payments p
      where p.shop_id = p_shop_id
        and p.status = 'paid'
        and p.method = 'transfer'
        and p.paid_at >= v_month_start
    )
  )
  into v_result;

  return v_result;
end;
$$;
