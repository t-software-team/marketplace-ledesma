-- Shop promotions ("stories"): image + text a shop_admin posts to promote a
-- product/service, shown as a special card in the feed for 1-3 days. Only
-- available to shops with an active paid subscription (enforced both here
-- with a trigger and in the UI).

insert into storage.buckets (id, name, public)
values ('shop-promotions', 'shop-promotions', true)
on conflict (id) do nothing;

drop policy if exists "Public Access to Shop Promotions" on storage.objects;
create policy "Public Access to Shop Promotions" on storage.objects
  for select
  using (bucket_id = 'shop-promotions');

drop policy if exists "Owners and Admins upload promotion assets" on storage.objects;
create policy "Owners and Admins upload promotion assets" on storage.objects
  for insert
  with check (
    bucket_id = 'shop-promotions'
    and (
      exists (
        select 1 from shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or is_superadmin()
    )
  );

drop policy if exists "Owners and Admins delete promotion assets" on storage.objects;
create policy "Owners and Admins delete promotion assets" on storage.objects
  for delete
  using (
    bucket_id = 'shop-promotions'
    and (
      exists (
        select 1 from shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or is_superadmin()
    )
  );

create table if not exists public.shop_promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  image_url text not null,
  text text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists shop_promotions_shop_id_idx on public.shop_promotions(shop_id);
create index if not exists shop_promotions_expires_at_idx on public.shop_promotions(expires_at);

alter table public.shop_promotions enable row level security;

drop policy if exists shop_promotions_select_visible on public.shop_promotions;
create policy shop_promotions_select_visible on public.shop_promotions
  for select
  using (
    (
      expires_at > now()
      and exists (
        select 1 from shops s
        where s.id = shop_promotions.shop_id
          and s.is_active = true
          and s.is_paused = false
          and s.deleted_at is null
      )
    )
    or exists (select 1 from shops s where s.id = shop_promotions.shop_id and s.owner_id = auth.uid())
    or is_superadmin()
  );

drop policy if exists shop_promotions_insert_shop_owner on public.shop_promotions;
create policy shop_promotions_insert_shop_owner on public.shop_promotions
  for insert
  with check (
    exists (select 1 from shops s where s.id = shop_promotions.shop_id and s.owner_id = auth.uid())
  );

drop policy if exists shop_promotions_delete_shop_owner on public.shop_promotions;
create policy shop_promotions_delete_shop_owner on public.shop_promotions
  for delete
  using (
    exists (select 1 from shops s where s.id = shop_promotions.shop_id and s.owner_id = auth.uid())
    or is_superadmin()
  );

create or replace function public.enforce_promotion_requires_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from subscriptions s
    where s.shop_id = new.shop_id
      and s.status = 'active'
  ) then
    raise exception 'Necesitás una suscripción activa para crear promociones.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_promotion_requires_subscription on shop_promotions;
create trigger trg_enforce_promotion_requires_subscription
  before insert on shop_promotions
  for each row
  execute function public.enforce_promotion_requires_subscription();
