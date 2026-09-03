-- Gym management vertical.
--
-- When a shop's category is "Gimnasio", the shop_admin manages the gym as an
-- internal CRM: members are internal records (fichas), NOT app users. A member
-- buys a membership for a plan with a fixed duration in days (daily drop-in,
-- multi-day pass, or monthly). Payments are collected at the desk (cash /
-- transfer) today; Mercado Pago is added later as a new payment method, which
-- is why payments live in their own table instead of columns on the membership.

-- ---------------------------------------------------------------------------
-- Category seed: "Gimnasio" (top-level service rubro)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, is_active, is_service)
select 'Gimnasio', 'gimnasio', true, true
where not exists (select 1 from public.categories where slug = 'gimnasio');

-- ---------------------------------------------------------------------------
-- Plans offered by the gym
-- ---------------------------------------------------------------------------
create table if not exists public.gym_plans (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  kind text not null default 'monthly'
    check (kind in ('daily', 'multi_day', 'monthly', 'custom')),
  duration_days integer not null check (duration_days > 0),
  price numeric(12, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_gym_plans_shop on public.gym_plans (shop_id);

-- ---------------------------------------------------------------------------
-- Members (internal fichas — a member is NOT an app user)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  document text,
  -- manual "baja": distinct from a merely expired membership
  is_archived boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_gym_members_shop on public.gym_members (shop_id);

-- ---------------------------------------------------------------------------
-- Membership periods (one row per alta / renewal)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_memberships (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  member_id uuid not null references public.gym_members(id) on delete cascade,
  plan_id uuid references public.gym_plans(id) on delete set null,
  start_date date not null default current_date,
  expires_at date not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gym_memberships_member on public.gym_memberships (member_id);
create index if not exists idx_gym_memberships_shop_expires on public.gym_memberships (shop_id, expires_at);

-- ---------------------------------------------------------------------------
-- Payments (cash / transfer today; mercadopago later)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  membership_id uuid not null references public.gym_memberships(id) on delete cascade,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  method text not null check (method in ('cash', 'transfer', 'mercadopago')),
  status text not null default 'paid' check (status in ('paid', 'pending', 'failed')),
  paid_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gym_payments_shop on public.gym_payments (shop_id);
create index if not exists idx_gym_payments_membership on public.gym_payments (membership_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: only the owning shop_admin (or a superadmin) may touch
-- gym data. Mirrors the shops/products ownership pattern.
-- ---------------------------------------------------------------------------
alter table public.gym_plans enable row level security;
alter table public.gym_members enable row level security;
alter table public.gym_memberships enable row level security;
alter table public.gym_payments enable row level security;

create policy "gym_plans_shop_owner" on public.gym_plans
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = gym_plans.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = gym_plans.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ));

create policy "gym_members_shop_owner" on public.gym_members
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = gym_members.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = gym_members.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ));

create policy "gym_memberships_shop_owner" on public.gym_memberships
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = gym_memberships.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = gym_memberships.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ));

create policy "gym_payments_shop_owner" on public.gym_payments
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = gym_payments.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = gym_payments.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ));

-- ---------------------------------------------------------------------------
-- Dashboard metrics in a single RPC. SECURITY DEFINER so it can aggregate
-- across tables, guarded by an explicit ownership check.
-- ---------------------------------------------------------------------------
create or replace function public.get_gym_dashboard_stats(p_shop_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from public.shops s
    where s.id = p_shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ) then
    raise exception 'not authorized for shop %', p_shop_id using errcode = '42501';
  end if;

  select jsonb_build_object(
    -- members with a currently-valid membership and not archived
    'active_members', (
      select count(distinct m.id)
      from public.gym_members m
      where m.shop_id = p_shop_id
        and m.is_archived = false
        and exists (
          select 1 from public.gym_memberships ms
          where ms.member_id = m.id and ms.expires_at >= current_date
        )
    ),
    -- not archived, but no valid membership today
    'expired_members', (
      select count(*)
      from public.gym_members m
      where m.shop_id = p_shop_id
        and m.is_archived = false
        and not exists (
          select 1 from public.gym_memberships ms
          where ms.member_id = m.id and ms.expires_at >= current_date
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
        and m.created_at >= date_trunc('month', now())
    ),
    -- memberships lapsing within the next 7 days (the gym's key KPI)
    'expiring_soon', (
      select count(distinct ms.member_id)
      from public.gym_memberships ms
      join public.gym_members m on m.id = ms.member_id and m.is_archived = false
      where ms.shop_id = p_shop_id
        and ms.expires_at >= current_date
        and ms.expires_at < current_date + 7
    ),
    'revenue_month_cash', (
      select coalesce(sum(p.amount), 0)
      from public.gym_payments p
      where p.shop_id = p_shop_id
        and p.status = 'paid'
        and p.method = 'cash'
        and p.paid_at >= date_trunc('month', now())
    ),
    'revenue_month_transfer', (
      select coalesce(sum(p.amount), 0)
      from public.gym_payments p
      where p.shop_id = p_shop_id
        and p.status = 'paid'
        and p.method = 'transfer'
        and p.paid_at >= date_trunc('month', now())
    )
  )
  into v_result;

  return v_result;
end;
$$;

alter function public.get_gym_dashboard_stats(uuid) owner to postgres;
grant execute on function public.get_gym_dashboard_stats(uuid) to authenticated;
