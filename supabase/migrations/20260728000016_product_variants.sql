-- Service/product variants: let a shop_admin offer several priced options
-- under one listing (e.g. "Corte" $3000, "Corte + barba" $5000) instead of
-- creating a separate product per option.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);

alter table public.product_variants enable row level security;

drop policy if exists product_variants_select_visible on public.product_variants;
create policy product_variants_select_visible on public.product_variants
  for select
  using (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_variants.product_id
        and (
          (p.is_active = true and s.is_active = true and s.is_paused = false and s.deleted_at is null)
          or s.owner_id = auth.uid()
          or is_superadmin()
        )
    )
  );

drop policy if exists product_variants_insert_shop_owner on public.product_variants;
create policy product_variants_insert_shop_owner on public.product_variants
  for insert
  with check (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_variants.product_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_variants_update_shop_owner on public.product_variants;
create policy product_variants_update_shop_owner on public.product_variants
  for update
  using (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_variants.product_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_variants_delete_shop_owner on public.product_variants;
create policy product_variants_delete_shop_owner on public.product_variants
  for delete
  using (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_variants.product_id
        and s.owner_id = auth.uid()
    )
  );
