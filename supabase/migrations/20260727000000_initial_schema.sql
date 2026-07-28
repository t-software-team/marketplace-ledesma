-- ============================================================
-- 20260727000000_initial_schema.sql
-- Schema inicial del marketplace de comercios (Ledesma).
-- Ejecutar con: supabase db push
-- ============================================================

-- ============================================================
-- 1. Extensiones
-- ============================================================
create extension if not exists postgis with schema public;
create extension if not exists pg_trgm with schema public;
create extension if not exists unaccent with schema public;
create extension if not exists "uuid-ossp" with schema public;
create extension if not exists pg_cron with schema public;

-- ============================================================
-- 2. Enums
-- ============================================================
create type public.user_role as enum ('client', 'shop_admin', 'superadmin');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.subscription_status as enum ('none', 'pending', 'active', 'expired', 'rejected');
create type public.report_reason as enum ('fake_product', 'scam', 'inappropriate', 'closed_permanently', 'other');
create type public.report_status as enum ('pending', 'reviewed', 'dismissed');

-- ============================================================
-- 3. Tablas
-- ============================================================

-- Perfiles de usuario
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text null,
  phone text null,
  avatar_url text null,
  city text null,
  role public.user_role null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorías de productos (jerárquicas)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  parent_id uuid null references public.categories(id) on delete set null,
  created_by uuid null references public.profiles(id) on delete set null,
  icon_url text null,
  created_at timestamptz not null default now()
);

-- Comercios (shops)
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text null,
  email text null,
  whatsapp_number text not null,
  address text null,
  city text null,
  category_id uuid null references public.categories(id) on delete set null,
  is_active boolean not null default true,
  is_paused boolean not null default false,
  paused_reason text null,
  verification_status public.verification_status not null default 'pending',
  verification_document_url text null,
  verified_at timestamptz null,
  verified_by uuid null references public.profiles(id) on delete set null,
  subscription_status public.subscription_status not null default 'none',
  subscription_expires_at timestamptz null,
  profile_views integer not null default 0,
  whatsapp_clicks integer not null default 0,
  location public.geography(Point, 4326) null,
  logo_url text null,
  cover_url text null,
  business_hours jsonb null,
  instagram_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Productos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  price numeric null,
  currency text not null default 'ARS',
  shop_id uuid not null references public.shops(id) on delete cascade,
  category_id uuid null references public.categories(id) on delete set null,
  is_active boolean not null default true,
  search_vector tsvector null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Imágenes de productos
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Favoritos (PK compuesto)
create table public.favorites (
  client_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, product_id)
);

-- Planes de suscripción
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  price numeric not null,
  duration_days integer not null,
  is_active boolean not null default true,
  benefits jsonb null,
  created_at timestamptz not null default now()
);

-- Suscripciones de comercios
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status public.subscription_status not null default 'pending',
  start_date timestamptz null,
  end_date timestamptz null,
  approved_at timestamptz null,
  approved_by uuid null references public.profiles(id) on delete set null,
  rejection_reason text null,
  payment_proof_url text null,
  created_at timestamptz not null default now()
);

-- Reportes de comercios
create table public.shop_reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  reported_by uuid null references public.profiles(id) on delete set null,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reason public.report_reason not null,
  status public.report_status not null default 'pending',
  comment text null,
  created_at timestamptz not null default now()
);

-- Notificaciones de administración
create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  reference_id uuid not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Log de auditoría
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid null references public.profiles(id) on delete set null,
  target_id uuid not null,
  target_table text not null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. Índices
-- ============================================================
create unique index idx_shops_slug on public.shops (slug);
create unique index idx_favorites_client_product on public.favorites (client_id, product_id);
create index idx_shops_location on public.shops using gist (location);
create index idx_products_search_vector on public.products using gin (search_vector);
create index idx_shops_name_trgm on public.shops using gin (name gin_trgm_ops);
create index idx_shops_owner_id on public.shops (owner_id);
create index idx_products_shop_id on public.products (shop_id);
create index idx_products_category_id on public.products (category_id);
create index idx_categories_parent_id on public.categories (parent_id);
create unique index idx_categories_slug on public.categories (slug);
create index idx_shop_reports_shop_id on public.shop_reports (shop_id);
create index idx_shop_reports_reported_by on public.shop_reports (reported_by);
create index idx_shop_reports_status on public.shop_reports (status);
create index idx_subscriptions_shop_id on public.subscriptions (shop_id);
create index idx_subscriptions_plan_id on public.subscriptions (plan_id);
create index idx_subscriptions_status on public.subscriptions (status);
create index idx_audit_log_actor_id on public.audit_log (actor_id);
create index idx_audit_log_target on public.audit_log (target_id, target_table);
create index idx_profiles_role on public.profiles (role);

-- ============================================================
-- 5. Funciones auxiliares y RPCs
-- ============================================================

-- handle_new_user: crea un perfil automáticamente al registrarse un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (auth.uid(), new.raw_user_meta_data->>'full_name', 'client');
  return new;
end;
$$;

create trigger handle_new_user_trigger
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- is_superadmin: retorna true si el usuario actual tiene rol superadmin.
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- get_products_feed: devuelve productos visibles con información del shop y distancia geográfica.
-- Filtra siempre is_paused = false e is_active = true y deleted_at IS NULL.
create or replace function public.get_products_feed(
  p_category_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default null,
  user_lat double precision default null,
  user_lng double precision default null
)
returns table (
  product_id uuid,
  product_name text,
  shop_id uuid,
  shop_name text,
  price numeric,
  main_image text,
  distance_km double precision,
  shop_is_featured boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit > 100 then
    p_limit := 100;
  elsif p_limit < 1 then
    p_limit := 1;
  end if;

  return query
  select
    p.id as product_id,
    p.name as product_name,
    s.id as shop_id,
    s.name as shop_name,
    p.price,
    (
      select pi.url
      from public.product_images pi
      where pi.product_id = p.id
      order by pi.sort_order asc
      limit 1
    ) as main_image,
    case
      when user_lat is not null and user_lng is not null and s.location is not null
      then round(
        (st_distance(
          st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
          s.location
        ) / 1000.0)::numeric,
        2
      )
      else null
    end as distance_km,
    s.subscription_status = 'active' as shop_is_featured
  from public.products p
  inner join public.shops s on s.id = p.shop_id
  where p.is_active = true
    and s.is_active = true
    and s.is_paused = false
    and s.deleted_at is null
    and (p.category_id = p_category_id or p_category_id is null)
    and (
      p_search is null
      or p.name ilike '%' || p_search || '%'
      or p.search_vector @@ plainto_tsquery('spanish', p_search)
    )
  order by
    s.subscription_status = 'active' desc nulls last,
    p.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- increment_shop_metric: actualiza profile_views o whatsapp_clicks de una shop.
create or replace function public.increment_shop_metric(
  p_shop_id uuid,
  p_metric text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_metric = 'profile_views' then
    update public.shops
    set profile_views = profile_views + 1,
        updated_at = now()
    where id = p_shop_id;
  elsif p_metric = 'whatsapp_clicks' then
    update public.shops
    set whatsapp_clicks = whatsapp_clicks + 1,
        updated_at = now()
    where id = p_shop_id;
  end if;
end;
$$;

-- expire_subscriptions: marca como expiradas las suscripciones y shops con fecha de fin vencida.
create or replace function public.expire_subscriptions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscriptions
  set status = 'expired'
  where status = 'active'
    and end_date is not null
    and end_date < now();

  update public.shops
  set subscription_status = 'expired',
      subscription_expires_at = null,
      updated_at = now()
  where subscription_status = 'active'
    and subscription_expires_at is not null
    and subscription_expires_at < now();
end;
$$;

-- approve_shop_verification: aprueba la verificación de un comercio (solo superadmin).
create or replace function public.approve_shop_verification(
  p_shop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede aprobar la verificación de un comercio';
  end if;

  update public.shops
  set verification_status = 'verified',
      verified_at = now(),
      verified_by = auth.uid(),
      updated_at = now()
  where id = p_shop_id;
end;
$$;

-- approve_subscription: aprueba una suscripción y actualiza el estado del comercio (solo superadmin).
create or replace function public.approve_subscription(
  p_subscription_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_end_date timestamptz;
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede aprobar suscripciones';
  end if;

  select s.shop_id, s.end_date
  into v_shop_id, v_end_date
  from public.subscriptions s
  where s.id = p_subscription_id;

  if v_shop_id is null then
    raise exception 'Suscripción no encontrada';
  end if;

  update public.subscriptions
  set status = 'active',
      approved_at = now(),
      approved_by = auth.uid()
  where id = p_subscription_id;

  update public.shops
  set subscription_status = 'active',
      subscription_expires_at = v_end_date,
      updated_at = now()
  where id = v_shop_id;
end;
$$;

-- ============================================================
-- 6. Row Level Security — Habilitar RLS en todas las tablas
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.shop_reports enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.audit_log enable row level security;

-- ============================================================
-- 7. Políticas RLS — profiles
-- ============================================================
create policy "profiles_select_owner_or_superadmin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_superadmin());

create policy "profiles_update_owner"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 8. Políticas RLS — categories
-- ============================================================
create policy "categories_select_active"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

create policy "categories_insert_superadmin"
  on public.categories for insert
  to authenticated
  with check (public.is_superadmin());

create policy "categories_update_superadmin"
  on public.categories for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "categories_delete_superadmin"
  on public.categories for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================
-- 9. Políticas RLS — shops
-- ============================================================
create policy "shops_select_active"
  on public.shops for select
  to anon, authenticated
  using (
    is_active = true
    and is_paused = false
    and deleted_at is null
  );

create policy "shops_select_superadmin"
  on public.shops for select
  to authenticated
  using (public.is_superadmin());

create policy "shops_insert_owner"
  on public.shops for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "shops_update_owner"
  on public.shops for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "shops_update_superadmin"
  on public.shops for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "shops_delete_owner"
  on public.shops for delete
  to authenticated
  using (auth.uid() = owner_id);

create policy "shops_delete_superadmin"
  on public.shops for delete
  to authenticated
  using (public.is_superadmin());

-- Política para shop_admin: puede actualizar su propia shop pero NO columnas sensibles.
-- RLS controla el acceso a nivel de fila; la restricción de columnas se aplica en la RPC de actualización.
create policy "shops_update_shop_admin_self"
  on public.shops for update
  to authenticated
  using (
    auth.uid() in (
      select id from public.profiles where role = 'shop_admin'
    )
    and auth.uid() = owner_id
  )
  with check (
    auth.uid() in (
      select id from public.profiles where role = 'shop_admin'
    )
    and auth.uid() = owner_id
  );

-- ============================================================
-- 10. Políticas RLS — products
-- ============================================================
create policy "products_select_visible"
  on public.products for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.shops s
      where s.id = products.shop_id
        and s.is_active = true
        and s.is_paused = false
        and s.deleted_at is null
    )
  );

create policy "products_insert_shop_owner"
  on public.products for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shops s
      where s.id = products.shop_id
        and s.owner_id = auth.uid()
    )
  );

create policy "products_update_shop_owner"
  on public.products for update
  to authenticated
  using (
    exists (
      select 1 from public.shops s
      where s.id = products.shop_id
        and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops s
      where s.id = products.shop_id
        and s.owner_id = auth.uid()
    )
  );

create policy "products_delete_shop_owner"
  on public.products for delete
  to authenticated
  using (
    exists (
      select 1 from public.shops s
      where s.id = products.shop_id
        and s.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 11. Políticas RLS — product_images
-- ============================================================
create policy "product_images_select_visible"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.is_active = true
        and exists (
          select 1 from public.shops s
          where s.id = p.shop_id
            and s.is_active = true
            and s.is_paused = false
            and s.deleted_at is null
        )
    )
  );

create policy "product_images_insert_shop_owner"
  on public.product_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  );

create policy "product_images_update_shop_owner"
  on public.product_images for update
  to authenticated
  using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  );

create policy "product_images_delete_shop_owner"
  on public.product_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 12. Políticas RLS — favorites
-- ============================================================
create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (auth.uid() = client_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = client_id);

-- ============================================================
-- 13. Políticas RLS — subscription_plans
-- ============================================================
create policy "subscription_plans_select_active"
  on public.subscription_plans for select
  to anon, authenticated
  using (is_active = true);

create policy "subscription_plans_insert_superadmin"
  on public.subscription_plans for insert
  to authenticated
  with check (public.is_superadmin());

create policy "subscription_plans_update_superadmin"
  on public.subscription_plans for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "subscription_plans_delete_superadmin"
  on public.subscription_plans for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================
-- 14. Políticas RLS — subscriptions
-- ============================================================
create policy "subscriptions_select_shop_admin_or_superadmin"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.shops s
      where s.id = subscriptions.shop_id
        and s.owner_id = auth.uid()
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shop_admin')
    )
    or public.is_superadmin()
  );

create policy "subscriptions_insert_superadmin"
  on public.subscriptions for insert
  to authenticated
  with check (public.is_superadmin());

create policy "subscriptions_update_superadmin"
  on public.subscriptions for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "subscriptions_delete_superadmin"
  on public.subscriptions for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================
-- 15. Políticas RLS — shop_reports
-- ============================================================
create policy "shop_reports_select_reporter_or_superadmin"
  on public.shop_reports for select
  to authenticated
  using (
    auth.uid() = reported_by
    or public.is_superadmin()
  );

create policy "shop_reports_insert_authenticated"
  on public.shop_reports for insert
  to authenticated
  with check (auth.uid() = reported_by);

create policy "shop_reports_update_superadmin"
  on public.shop_reports for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "shop_reports_delete_superadmin"
  on public.shop_reports for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================
-- 16. Políticas RLS — admin_notifications
-- ============================================================
create policy "admin_notifications_select_superadmin"
  on public.admin_notifications for select
  to authenticated
  using (public.is_superadmin());

create policy "admin_notifications_insert_superadmin"
  on public.admin_notifications for insert
  to authenticated
  with check (public.is_superadmin());

create policy "admin_notifications_update_superadmin"
  on public.admin_notifications for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "admin_notifications_delete_superadmin"
  on public.admin_notifications for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================
-- 17. Políticas RLS — audit_log
-- ============================================================
create policy "audit_log_select_superadmin"
  on public.audit_log for select
  to authenticated
  using (public.is_superadmin());

create policy "audit_log_insert_service_role"
  on public.audit_log for insert
  to authenticated
  with check (public.is_superadmin());

create policy "audit_log_update_superadmin"
  on public.audit_log for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "audit_log_delete_superadmin"
  on public.audit_log for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================

-- ============================================================
-- 18. Almacenamiento (Storage) — Buckets y Policies
-- ============================================================

-- Helper para verificar que un archivo en storage pertenece al auth.uid().
-- Para buckets de shops: el path es shops/{shop_id}/... donde owner_id = auth.uid().
-- Para avatares: el path es avatars/{user_id}/... donde user_id = auth.uid().
create or replace function public.storage_is_owner(p_bucket text, p_path text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_owner_id uuid;
begin
  if p_bucket in ('shop-logos', 'shop-covers', 'product-images', 'verification-documents') then
    v_shop_id := split_part(p_path, '/', 2)::uuid;
    select owner_id into v_owner_id from public.shops where id = v_shop_id;
    return v_owner_id = auth.uid();
  elsif p_bucket = 'profile-avatars' then
    return split_part(p_path, '/', 2) = auth.uid()::text;
  end if;
  return false;
end;
$$;

-- Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-logos', 'shop-logos', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-covers', 'shop-covers', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/pdf', 'image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- shop-logos: el owner de la shop puede gestionar sus archivos.
create policy "shop_logos_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shop-logos' and public.storage_is_owner(bucket_id, name));

create policy "shop_logos_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shop-logos' and public.storage_is_owner(bucket_id, name));

create policy "shop_logos_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shop-logos' and public.storage_is_owner(bucket_id, name));

create policy "shop_logos_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shop-logos' and public.storage_is_owner(bucket_id, name));

-- shop-covers
create policy "shop_covers_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shop-covers' and public.storage_is_owner(bucket_id, name));

create policy "shop_covers_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shop-covers' and public.storage_is_owner(bucket_id, name));

create policy "shop_covers_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shop-covers' and public.storage_is_owner(bucket_id, name));

create policy "shop_covers_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shop-covers' and public.storage_is_owner(bucket_id, name));

-- product-images
create policy "product_images_select_shop_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and public.storage_is_owner(bucket_id, name));

create policy "product_images_insert_shop_owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.storage_is_owner(bucket_id, name));

create policy "product_images_update_shop_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.storage_is_owner(bucket_id, name));

create policy "product_images_delete_shop_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.storage_is_owner(bucket_id, name));

-- verification-documents
create policy "verification_docs_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'verification-documents' and public.storage_is_owner(bucket_id, name));

create policy "verification_docs_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'verification-documents' and public.storage_is_owner(bucket_id, name));

create policy "verification_docs_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'verification-documents' and public.storage_is_owner(bucket_id, name));

create policy "verification_docs_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'verification-documents' and public.storage_is_owner(bucket_id, name));

-- profile-avatars
create policy "profile_avatars_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-avatars' and public.storage_is_owner(bucket_id, name));

create policy "profile_avatars_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-avatars' and public.storage_is_owner(bucket_id, name));

create policy "profile_avatars_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-avatars' and public.storage_is_owner(bucket_id, name));

create policy "profile_avatars_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-avatars' and public.storage_is_owner(bucket_id, name));
