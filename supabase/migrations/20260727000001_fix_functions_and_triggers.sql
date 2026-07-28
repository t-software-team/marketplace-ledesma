-- ============================================================
-- 20260727000001_fix_functions_and_triggers.sql
-- Corrige divergencias entre la migración inicial y lo realmente
-- aplicado en remoto (fuente de verdad usada por el frontend), y
-- agrega piezas del addendum 9.1 que faltaban.
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles.role debe quedar NULL hasta el onboarding.
--    El middleware redirige a /onboarding cuando profile.role es null;
--    con default 'client' ese gate nunca se disparaba.
-- ------------------------------------------------------------
alter table public.profiles alter column role drop default;

-- ------------------------------------------------------------
-- 2. handle_new_user: usar new.id (auth.uid() es null en este contexto
--    de trigger) y no asignar role, para respetar el onboarding.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. get_products_feed: alinear firma y orden de columnas con lo
--    que ya usa el frontend (named params, no rompe llamadas), y
--    conservar los filtros de seguridad (is_paused, deleted_at,
--    security definer, limit clamp) sumando el orden por distancia
--    que pedía el doc y se había perdido.
-- ------------------------------------------------------------
drop function if exists public.get_products_feed(uuid, integer, integer, text, double precision, double precision);

create or replace function public.get_products_feed(
  user_lat double precision default null,
  user_lng double precision default null,
  p_category_id uuid default null,
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  product_id uuid,
  product_name text,
  price numeric,
  shop_id uuid,
  shop_name text,
  shop_is_featured boolean,
  distance_km double precision,
  main_image text
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
    p.price,
    s.id as shop_id,
    s.name as shop_name,
    (s.subscription_status = 'active') as shop_is_featured,
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
    (
      select pi.url
      from public.product_images pi
      where pi.product_id = p.id
      order by pi.sort_order asc
      limit 1
    ) as main_image
  from public.products p
  inner join public.shops s on s.id = p.shop_id
  where p.is_active = true
    and s.is_active = true
    and s.is_paused = false
    and s.deleted_at is null
    and (p_category_id is null or p.category_id = p_category_id)
    and (
      p_search is null
      or p.name ilike '%' || p_search || '%'
      or p.search_vector @@ plainto_tsquery('spanish', unaccent(p_search))
    )
  order by
    shop_is_featured desc nulls last,
    distance_km asc nulls last,
    p.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- ------------------------------------------------------------
-- 4. increment_shop_metric: los valores de p_metric deben ser
--    'view' / 'whatsapp_click', que es lo que ya envía el frontend
--    (shop-view-tracker.tsx, whatsapp-button.tsx).
-- ------------------------------------------------------------
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
  if p_metric = 'view' then
    update public.shops
    set profile_views = profile_views + 1,
        updated_at = now()
    where id = p_shop_id;
  elsif p_metric = 'whatsapp_click' then
    update public.shops
    set whatsapp_clicks = whatsapp_clicks + 1,
        updated_at = now()
    where id = p_shop_id;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 5. Trigger genérico de updated_at (doc 9.1).
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_shops_updated_at on public.shops;
create trigger trg_shops_updated_at
  before update on public.shops
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- 6. sync_shop_subscription_status (doc 9.1): mantiene
--    shops.subscription_status sincronizado aunque alguien
--    actualice subscriptions sin pasar por approve_subscription.
-- ------------------------------------------------------------
create or replace function public.sync_shop_subscription_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    update public.shops
    set subscription_status = 'active',
        subscription_expires_at = new.end_date,
        updated_at = now()
    where id = new.shop_id;
  elsif new.status in ('expired', 'rejected') then
    update public.shops
    set subscription_status = new.status,
        updated_at = now()
    where id = new.shop_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_shop_subscription on public.subscriptions;
create trigger trg_sync_shop_subscription
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_shop_subscription_status();

-- ------------------------------------------------------------
-- 7. Notificaciones automáticas para el superadmin (doc 9.1):
--    nueva verificación pendiente, nueva suscripción pendiente,
--    nuevo reporte.
-- ------------------------------------------------------------
create or replace function public.notify_admin_pending_shop_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status = 'pending'
     and (tg_op = 'INSERT' or old.verification_status is distinct from 'pending') then
    insert into public.admin_notifications (type, reference_id)
    values ('new_verification_request', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_shop_verification on public.shops;
create trigger trg_notify_shop_verification
  after insert or update on public.shops
  for each row execute procedure public.notify_admin_pending_shop_verification();

create or replace function public.notify_admin_new_subscription_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, reference_id)
  values ('new_subscription_request', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_new_subscription on public.subscriptions;
create trigger trg_notify_new_subscription
  after insert on public.subscriptions
  for each row execute procedure public.notify_admin_new_subscription_request();

create or replace function public.notify_admin_new_shop_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, reference_id)
  values ('new_report', new.id);
  return new;
end;
$$;

drop trigger if exists trg_notify_new_shop_report on public.shop_reports;
create trigger trg_notify_new_shop_report
  after insert on public.shop_reports
  for each row execute procedure public.notify_admin_new_shop_report();
