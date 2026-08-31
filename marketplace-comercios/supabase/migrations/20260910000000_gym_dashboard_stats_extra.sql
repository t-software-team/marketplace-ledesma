-- Two more at-a-glance figures for the gym's Resumen (landing) page:
--   - checkins_today: pulse metric, distinct from the by-range chart in
--     Reportes (that one needs its own filtered query; this is a single
--     cheap count for "how's today going").
--   - members_without_phone: operational alert unique to this app — a member
--     with no phone can't use the self check-in kiosk (matched by phone
--     digits), so this tells the owner who to update.
-- Both fold into the existing single-round-trip stats RPC rather than adding
-- separate queries to the landing page.
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
  v_today_start timestamptz := v_today::timestamptz at time zone 'America/Argentina/Buenos_Aires';
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
    ),
    'checkins_today', (
      select count(*)
      from public.gym_check_ins c
      where c.shop_id = p_shop_id
        and c.outcome = 'allowed'
        and c.checked_in_at >= v_today_start
    ),
    'members_without_phone', (
      select count(*)
      from public.gym_members m
      where m.shop_id = p_shop_id
        and m.is_archived = false
        and (m.phone is null or btrim(m.phone) = '')
    )
  )
  into v_result;

  return v_result;
end;
$$;
