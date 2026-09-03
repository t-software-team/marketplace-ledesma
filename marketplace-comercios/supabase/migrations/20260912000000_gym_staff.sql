-- Gym employees: a shop owner can invite staff (by email) who get their own
-- login and a SCOPED subset of access — mostrador (check-in) + altas/
-- renovaciones — never caja completa (void), planes, reportes, personalizar,
-- configuración or suscripción. Those stay owner-only because the resolvers
-- that back them (getMyShopId, getMyShop) are intentionally left untouched by
-- this migration's application-code counterpart; RLS here only opens the
-- specific commands the agreed scope allows, nothing else.
create table if not exists public.shop_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  -- Null until the invite is accepted — the invited person may not have an
  -- account yet.
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  invite_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (shop_id, invited_email)
);

create index if not exists idx_shop_staff_shop on public.shop_staff (shop_id);
create index if not exists idx_shop_staff_user on public.shop_staff (user_id) where user_id is not null;
create unique index if not exists idx_shop_staff_token on public.shop_staff (invite_token);

alter table public.shop_staff enable row level security;

-- Owner (or superadmin) manages their shop's staff roster end to end.
create policy "shop_staff_owner_manage" on public.shop_staff
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_staff.shop_id and (s.owner_id = auth.uid() or public.is_superadmin())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_staff.shop_id and (s.owner_id = auth.uid() or public.is_superadmin())
  ));

-- An invited/active staff member can read their own membership row — needed
-- to resolve which shop they belong to.
create policy "shop_staff_self_read" on public.shop_staff
  for select to authenticated
  using (user_id = auth.uid());

-- security definer: avoids re-entering shop_staff's own RLS (which would
-- recurse) when other tables' policies call this to check membership.
create or replace function public.is_shop_staff(p_shop_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from public.shop_staff
    where shop_id = p_shop_id and user_id = auth.uid() and status = 'active'
  );
$$;

-- Staff can read the shop they belong to (name/logo/category for the nav and
-- dashboard header) — never write it; UPDATE stays owner-only via the
-- existing column-level grants.
create policy "shops_staff_read" on public.shops
  for select to authenticated
  using (public.is_shop_staff(id));

-- ---------------------------------------------------------------------------
-- Scoped staff access on gym tables. Each existing "shop_owner" policy is
-- `for all` and untouched; these ADD narrow, command-specific policies for
-- staff. Postgres OR's every applicable policy per command, so this only
-- ever widens who may SELECT/INSERT on these tables — never UPDATE/DELETE,
-- which is exactly the "no caja completa (anular), no planes, no altas de
-- config" boundary agreed for this role.
-- ---------------------------------------------------------------------------

-- gym_members: staff can see the roster and register new members (altas).
create policy "gym_members_staff_select" on public.gym_members
  for select to authenticated
  using (public.is_shop_staff(shop_id));

create policy "gym_members_staff_insert" on public.gym_members
  for insert to authenticated
  with check (public.is_shop_staff(shop_id));

-- gym_memberships: staff can see membership history and create a new period
-- (renovar).
create policy "gym_memberships_staff_select" on public.gym_memberships
  for select to authenticated
  using (public.is_shop_staff(shop_id));

create policy "gym_memberships_staff_insert" on public.gym_memberships
  for insert to authenticated
  with check (public.is_shop_staff(shop_id));

-- gym_payments: staff can see payment history and record the charge for a
-- renewal — never void one (voidGymPayment stays owner-only at the app
-- layer, and there is deliberately no staff UPDATE policy here).
create policy "gym_payments_staff_select" on public.gym_payments
  for select to authenticated
  using (public.is_shop_staff(shop_id));

create policy "gym_payments_staff_insert" on public.gym_payments
  for insert to authenticated
  with check (public.is_shop_staff(shop_id));

-- gym_check_ins: staff runs the front desk.
create policy "gym_check_ins_staff_select" on public.gym_check_ins
  for select to authenticated
  using (public.is_shop_staff(shop_id));

create policy "gym_check_ins_staff_insert" on public.gym_check_ins
  for insert to authenticated
  with check (public.is_shop_staff(shop_id));

-- gym_plans: staff needs to read plans to pick one when renewing a member,
-- but never creates/edits/deletes one.
create policy "gym_plans_staff_select" on public.gym_plans
  for select to authenticated
  using (public.is_shop_staff(shop_id));
