DROP FUNCTION IF EXISTS "public"."get_products_feed"(double precision, double precision, "uuid", "text", integer, integer, "text", "text");

CREATE OR REPLACE FUNCTION "public"."get_products_feed"("user_lat" double precision DEFAULT NULL::double precision, "user_lng" double precision DEFAULT NULL::double precision, "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0, "p_seed" "text" DEFAULT NULL::"text", "p_attribute_value" "text" DEFAULT NULL::"text") RETURNS TABLE("product_id" "uuid", "product_name" "text", "price" numeric, "shop_id" "uuid", "shop_name" "text", "shop_is_featured" boolean, "product_is_featured" boolean, "distance_km" double precision, "main_image" "text", "category_name" "text", "parent_category_name" "text", "attributes" "jsonb", "rubro_slug" "text", "shop_is_verified" boolean, "is_service" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
    parent_c.name as parent_category_name,
    (
      select coalesce(jsonb_agg(distinct pav.value), '[]'::jsonb)
      from public.product_attribute_values pav
      where pav.product_id = p.id
    ) as attributes,
    shop_rubro.slug as rubro_slug,
    (s.verification_status = 'verified' and s.subscription_status = 'active') as shop_is_verified,
    coalesce(c.is_service, false) as is_service
  from public.products p
  inner join public.shops s on s.id = p.shop_id
  left join public.categories c on c.id = p.category_id
  left join public.categories parent_c on parent_c.id = c.parent_id
  left join public.categories shop_rubro on shop_rubro.id = s.category_id
  left join lateral (
    select avg(sr.rating) as avg_rating, count(*) as review_count
    from public.shop_reviews sr
    where sr.shop_id = s.id
  ) rating on true
  left join lateral (
    select greatest(s.updated_at, max(p2.updated_at)) as last_activity
    from public.products p2
    where p2.shop_id = s.id
  ) activity on true
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
      or s.name ilike '%' || p_search || '%'
    )
    and (
      p_attribute_value is null
      or exists (
        select 1 from public.product_attribute_values pav
        where pav.product_id = p.id and pav.value = p_attribute_value
      )
    )
  order by
    p.is_featured desc,
    shop_is_featured desc nulls last,
    case
      when s.subscription_status = 'active' then 0
      when activity.last_activity is not null and activity.last_activity >= now() - interval '60 days' then 0
      else 1
    end asc,
    case
      when s.subscription_status = 'active' and rating.review_count >= 3
      then rating.avg_rating
      else null
    end desc nulls last,
    distance_km asc nulls last,
    case when p_seed is not null then md5(p.id::text || p_seed) end,
    random()
  limit p_limit
  offset p_offset;
end;
$$;

ALTER FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") TO "service_role";
