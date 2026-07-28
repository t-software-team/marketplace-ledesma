-- ============================================================
-- 20260728000008_client_features.sql
-- Suma 4 features para el rol client:
-- 1. Avatar propio (bucket + storage policies; nombre/telefono/
--    ciudad ya eran editables vía RLS existente en profiles).
-- 2. Seguir comercios (shop_follows) + notificación cuando un
--    comercio seguido publica un producto nuevo.
-- 3. Notificaciones propias del client (client_notifications).
-- 4. Historial de contacto por WhatsApp (shop_contacts).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Avatar bucket
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public read avatars"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "Owner manage avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner update avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner delete avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- 2. Seguir comercios
-- ------------------------------------------------------------
create table public.shop_follows (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shop_id, client_id)
);

create index idx_shop_follows_shop_id on public.shop_follows (shop_id);
create index idx_shop_follows_client_id on public.shop_follows (client_id);

alter table public.shop_follows enable row level security;

create policy "shop_follows_select_own"
  on public.shop_follows for select
  to authenticated
  using (client_id = auth.uid());

create policy "shop_follows_insert_own"
  on public.shop_follows for insert
  to authenticated
  with check (client_id = auth.uid());

create policy "shop_follows_delete_own"
  on public.shop_follows for delete
  to authenticated
  using (client_id = auth.uid());

create or replace function public.get_shop_follow_stats(p_shop_id uuid)
returns table (follower_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select count(*) as follower_count
  from public.shop_follows
  where shop_id = p_shop_id;
$$;

revoke all on function public.get_shop_follow_stats(uuid) from public;
grant execute on function public.get_shop_follow_stats(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Notificaciones del client
-- ------------------------------------------------------------
create table public.client_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  reference_id uuid not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_client_notifications_client_id on public.client_notifications (client_id, is_read);

alter table public.client_notifications enable row level security;

create policy "client_notifications_select_own"
  on public.client_notifications for select
  to authenticated
  using (client_id = auth.uid());

create policy "client_notifications_update_own"
  on public.client_notifications for update
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create or replace function public.mark_client_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.client_notifications
  set is_read = true
  where client_id = auth.uid() and is_read = false;
end;
$$;

revoke all on function public.mark_client_notifications_read() from public;
grant execute on function public.mark_client_notifications_read() to authenticated;

-- Cuando un producto nuevo se activa en un shop seguido, notificar
-- a cada follower. security definer porque el insert de un shop_admin
-- en products no tiene permiso para escribir en client_notifications
-- de otro usuario vía RLS normal.
create or replace function public.notify_shop_followers_new_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.is_active = true then
    insert into public.client_notifications (client_id, type, reference_id)
    select client_id, 'new_product', new.id
    from public.shop_follows
    where shop_id = new.shop_id;
  elsif tg_op = 'UPDATE' and new.is_active = true and old.is_active = false then
    insert into public.client_notifications (client_id, type, reference_id)
    select client_id, 'new_product', new.id
    from public.shop_follows
    where shop_id = new.shop_id;
  end if;
  return new;
end;
$$;

create trigger trg_notify_shop_followers_new_product
  after insert or update of is_active on public.products
  for each row execute procedure public.notify_shop_followers_new_product();

-- ------------------------------------------------------------
-- 4. Historial de contacto por WhatsApp
-- ------------------------------------------------------------
create table public.shop_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid null references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_shop_contacts_client_id on public.shop_contacts (client_id, created_at desc);

alter table public.shop_contacts enable row level security;

create policy "shop_contacts_select_own"
  on public.shop_contacts for select
  to authenticated
  using (client_id = auth.uid());

create policy "shop_contacts_insert_own"
  on public.shop_contacts for insert
  to authenticated
  with check (client_id = auth.uid());
