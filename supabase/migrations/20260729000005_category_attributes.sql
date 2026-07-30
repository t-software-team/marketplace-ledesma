-- Generic per-rubro product attributes (talle/color for ropa, año/km/marca
-- for concesionaria, etc.) instead of hardcoding columns per category. New
-- rubros can define their own attributes without a schema change.

create table if not exists public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null check (type in ('select', 'multiselect', 'text', 'number')),
  options jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, key)
);

create table if not exists public.product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_id uuid not null references public.category_attributes(id) on delete cascade,
  value text not null
);

create index if not exists product_attribute_values_product_id_idx on public.product_attribute_values(product_id);
create index if not exists product_attribute_values_attribute_id_idx on public.product_attribute_values(attribute_id);
create index if not exists product_attribute_values_lookup_idx on public.product_attribute_values(attribute_id, value);

alter table public.category_attributes enable row level security;
alter table public.product_attribute_values enable row level security;

drop policy if exists category_attributes_select_public on public.category_attributes;
create policy category_attributes_select_public on public.category_attributes
  for select
  using (true);

drop policy if exists category_attributes_write_superadmin on public.category_attributes;
create policy category_attributes_write_superadmin on public.category_attributes
  for all
  using (is_superadmin())
  with check (is_superadmin());

drop policy if exists product_attribute_values_select_visible on public.product_attribute_values;
create policy product_attribute_values_select_visible on public.product_attribute_values
  for select
  using (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_attribute_values.product_id
        and (
          (p.is_active = true and s.is_active = true and s.is_paused = false and s.deleted_at is null)
          or s.owner_id = auth.uid()
          or is_superadmin()
        )
    )
  );

drop policy if exists product_attribute_values_insert_shop_owner on public.product_attribute_values;
create policy product_attribute_values_insert_shop_owner on public.product_attribute_values
  for insert
  with check (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_attribute_values.product_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_attribute_values_delete_shop_owner on public.product_attribute_values;
create policy product_attribute_values_delete_shop_owner on public.product_attribute_values
  for delete
  using (
    exists (
      select 1 from products p
      join shops s on s.id = p.shop_id
      where p.id = product_attribute_values.product_id
        and s.owner_id = auth.uid()
    )
  );

-- Seed attributes for the categories where they add the most value.
insert into public.category_attributes (category_id, key, label, type, options, sort_order) values
  ('a2222222-2222-2222-2222-222222222222', 'talle', 'Talle', 'multiselect', '["XS","S","M","L","XL","XXL"]'::jsonb, 1),
  ('a2222222-2222-2222-2222-222222222222', 'color', 'Color', 'multiselect', '["Negro","Blanco","Gris","Azul","Rojo","Verde","Amarillo","Rosa","Beige","Multicolor"]'::jsonb, 2),
  ('c3333333-3333-3333-3333-333333333333', 'marca', 'Marca', 'text', null, 1),
  ('c3333333-3333-3333-3333-333333333333', 'modelo', 'Modelo', 'text', null, 2),
  ('c3333333-3333-3333-3333-333333333333', 'anio', 'Año', 'number', null, 3),
  ('c3333333-3333-3333-3333-333333333333', 'kilometraje', 'Kilometraje', 'number', null, 4),
  ('f7777777-7777-7777-7777-777777777777', 'unidad_venta', 'Unidad de venta', 'select', '["Unidad","Bolsa","m³","Metro","Kilo"]'::jsonb, 1)
on conflict (category_id, key) do nothing;
