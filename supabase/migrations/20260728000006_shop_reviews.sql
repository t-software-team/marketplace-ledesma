-- ============================================================
-- 20260728000006_shop_reviews.sql
-- Reseñas de clientes a comercios (rating 1-5 + comentario
-- opcional). Públicas, una por cliente por comercio. El
-- promedio se usa como boost de posicionamiento en el feed
-- SOLO para comercios con suscripción activa (perk de plan
-- pago), con un piso mínimo de reseñas para evitar que 1
-- reseña de 5 estrellas le gane a un shop con historial real.
-- ============================================================
create table public.shop_reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, client_id)
);

create index idx_shop_reviews_shop_id on public.shop_reviews (shop_id);

create trigger trg_shop_reviews_updated_at
  before update on public.shop_reviews
  for each row execute procedure public.set_updated_at();

alter table public.shop_reviews enable row level security;

create policy "shop_reviews_select_public"
  on public.shop_reviews for select
  to anon, authenticated
  using (true);

create policy "shop_reviews_insert_own"
  on public.shop_reviews for insert
  to authenticated
  with check (client_id = auth.uid());

create policy "shop_reviews_update_own"
  on public.shop_reviews for update
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "shop_reviews_delete_own"
  on public.shop_reviews for delete
  to authenticated
  using (client_id = auth.uid() or public.is_superadmin());

-- ------------------------------------------------------------
-- get_shop_rating: promedio + cantidad de reseñas de un shop.
-- ------------------------------------------------------------
create or replace function public.get_shop_rating(p_shop_id uuid)
returns table (avg_rating numeric, review_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(round(avg(rating)::numeric, 1), 0) as avg_rating,
    count(*) as review_count
  from public.shop_reviews
  where shop_id = p_shop_id;
$$;

revoke all on function public.get_shop_rating(uuid) from public;
grant execute on function public.get_shop_rating(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- get_products_feed: suma boost por rating, solo para shops con
-- suscripción activa y un piso de 3 reseñas mínimo.
-- ------------------------------------------------------------
drop function if exists public.get_products_feed(double precision, double precision, uuid, text, integer, integer);

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
  product_is_featured boolean,
  distance_km double precision,
  main_image text,
  category_name text,
  parent_category_name text
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
    p.is_featured as product_is_featured,
    case
      when user_lat is not null and user_lng is not null and s.location is not null
      then round(
        (st_distance(
          st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
          s.location
        ) / 1000.0)::numeric,
        2
      )::double precision
      else null
    end as distance_km,
    (
      select pi.url
      from public.product_images pi
      where pi.product_id = p.id
      order by pi.sort_order asc
      limit 1
    ) as main_image,
    c.name as category_name,
    parent_c.name as parent_category_name
  from public.products p
  inner join public.shops s on s.id = p.shop_id
  left join public.categories c on c.id = p.category_id
  left join public.categories parent_c on parent_c.id = c.parent_id
  left join lateral (
    select avg(sr.rating) as avg_rating, count(*) as review_count
    from public.shop_reviews sr
    where sr.shop_id = s.id
  ) rating on true
  where p.is_active = true
    and s.is_active = true
    and s.is_paused = false
    and s.deleted_at is null
    and (
      p_category_id is null
      or p.category_id = p_category_id
      or exists (
        select 1 from public.categories cc
        where cc.id = p.category_id and cc.parent_id = p_category_id
      )
    )
    and (
      p_search is null
      or p.name ilike '%' || p_search || '%'
      or p.search_vector @@ plainto_tsquery('spanish', unaccent(p_search))
    )
  order by
    p.is_featured desc,
    shop_is_featured desc nulls last,
    case
      when s.subscription_status = 'active' and rating.review_count >= 3
      then rating.avg_rating
      else null
    end desc nulls last,
    distance_km asc nulls last,
    random()
  limit p_limit
  offset p_offset;
end;
$$;

revoke all on function public.get_products_feed(double precision, double precision, uuid, text, integer, integer) from public;
grant execute on function public.get_products_feed(double precision, double precision, uuid, text, integer, integer) to anon, authenticated;
