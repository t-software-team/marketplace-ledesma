-- Gym access control: records a member entering the gym (check-in).
-- One row per entry. Whether the membership was valid at that moment is
-- derived at read time from gym_memberships, not duplicated here.
create table if not exists public.gym_check_ins (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  member_id uuid not null references public.gym_members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_gym_check_ins_shop_time
  on public.gym_check_ins (shop_id, checked_in_at desc);
create index if not exists idx_gym_check_ins_member
  on public.gym_check_ins (member_id, checked_in_at desc);

alter table public.gym_check_ins enable row level security;

create policy "gym_check_ins_shop_owner" on public.gym_check_ins
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = gym_check_ins.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = gym_check_ins.shop_id
      and (s.owner_id = auth.uid() or public.is_superadmin())
  ));
