-- ============================================================
-- 20260728000005_product_featured.sql
-- Permite marcar productos individuales como "destacados".
-- Solo tiene sentido si el comercio tiene suscripción activa
-- (se valida en el server action, no acá — mismo criterio que
-- el límite de productos por plan).
-- ============================================================
alter table public.products
  add column if not exists is_featured boolean not null default false;

create index if not exists idx_products_is_featured
  on public.products (is_featured)
  where is_featured = true;

-- ------------------------------------------------------------
-- get_products_feed: suma product_is_featured al resultado y
-- lo prioriza en el orden; cuando no hay location conocida cae
-- a random() en vez de created_at desc (feed inicial variado).
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
    distance_km asc nulls last,
    random()
  limit p_limit
  offset p_offset;
end;
$$;

revoke all on function public.get_products_feed(double precision, double precision, uuid, text, integer, integer) from public;
grant execute on function public.get_products_feed(double precision, double precision, uuid, text, integer, integer) to anon, authenticated;
