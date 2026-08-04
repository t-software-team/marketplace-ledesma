


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."report_reason" AS ENUM (
    'fake_product',
    'scam',
    'inappropriate',
    'closed_permanently',
    'other'
);


ALTER TYPE "public"."report_reason" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'pending',
    'reviewed',
    'dismissed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'none',
    'pending',
    'active',
    'expired',
    'rejected'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'client',
    'shop_admin',
    'superadmin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_shop_plan"("p_shop_id" "uuid", "p_plan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_duration_days integer;
  v_end_date timestamptz;
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede cambiar el plan de un comercio';
  end if;

  update public.subscriptions
  set status = 'expired'
  where shop_id = p_shop_id
    and status = 'active';

  if p_plan_id is null then
    update public.shops
    set subscription_status = 'none',
        subscription_expires_at = null,
        updated_at = now()
    where id = p_shop_id;
    return;
  end if;

  select duration_days into v_duration_days
  from public.subscription_plans
  where id = p_plan_id;

  if v_duration_days is null then
    raise exception 'Plan no encontrado';
  end if;

  v_end_date := now() + (v_duration_days || ' days')::interval;

  insert into public.subscriptions (shop_id, plan_id, status, start_date, end_date, approved_at, approved_by)
  values (p_shop_id, p_plan_id, 'active', now(), v_end_date, now(), auth.uid());

  update public.shops
  set subscription_status = 'active',
      subscription_expires_at = v_end_date,
      updated_at = now()
  where id = p_shop_id;
end;
$$;


ALTER FUNCTION "public"."admin_set_shop_plan"("p_shop_id" "uuid", "p_plan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_category_suggestion"("p_suggestion_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_suggestion record;
  v_slug text;
  v_new_id uuid;
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede aprobar categorías';
  end if;

  select * into v_suggestion from category_suggestions where id = p_suggestion_id and status = 'pending';
  if v_suggestion is null then
    raise exception 'Sugerencia no encontrada o ya revisada';
  end if;

  v_slug := regexp_replace(public.normalize_category_text(v_suggestion.name), '\s+', '-', 'g');
  if v_suggestion.parent_id is not null then
    v_slug := (select slug from categories where id = v_suggestion.parent_id) || '-' || v_slug;
  end if;

  insert into categories (name, slug, parent_id, is_active, created_by)
  values (v_suggestion.name, v_slug, v_suggestion.parent_id, true, auth.uid())
  returning id into v_new_id;

  update category_suggestions
  set status = 'approved', resulting_category_id = v_new_id, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_suggestion_id;

  return v_new_id;
end;
$$;


ALTER FUNCTION "public"."approve_category_suggestion"("p_suggestion_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_shop_verification"("p_shop_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."approve_shop_verification"("p_shop_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_subscription"("p_subscription_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."approve_subscription"("p_subscription_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_subscription_by_payment"("p_subscription_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_shop_id uuid;
  v_end_date timestamptz;
  v_status text;
  v_duration_days integer;
begin
  select s.shop_id, s.status, p.duration_days
  into v_shop_id, v_status, v_duration_days
  from public.subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.id = p_subscription_id;

  if v_shop_id is null then
    raise exception 'Suscripción no encontrada';
  end if;

  if v_status = 'active' then
    return;
  end if;

  v_end_date := now() + (v_duration_days || ' days')::interval;

  -- Expira cualquier otra suscripción activa del mismo shop antes de activar la nueva
  update public.subscriptions
  set status = 'expired'
  where shop_id = v_shop_id
    and status = 'active'
    and id <> p_subscription_id;

  update public.subscriptions
  set status = 'active',
      start_date = now(),
      end_date = v_end_date,
      approved_at = now(),
      galiopay_status = 'approved'
  where id = p_subscription_id;

  update public.shops
  set subscription_status = 'active',
      subscription_expires_at = v_end_date,
      updated_at = now()
  where id = v_shop_id;
end;
$$;


ALTER FUNCTION "public"."approve_subscription_by_payment"("p_subscription_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_actor" "text", "p_action" "text", "p_max_count" integer, "p_window_seconds" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_count integer;
begin
  delete from public.rate_limit_events
  where action = p_action
    and created_at < now() - (p_window_seconds || ' seconds')::interval
    and random() < 0.05;

  select count(*) into v_count
  from public.rate_limit_events
  where actor = p_actor
    and action = p_action
    and created_at > now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_events (actor, action) values (p_actor, p_action);
  return true;
end;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_actor" "text", "p_action" "text", "p_max_count" integer, "p_window_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_product_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_max integer;
  v_used integer;
  v_is_service boolean;
begin
  select (sp.benefits ->> 'max_products')::integer
    into v_max
  from subscriptions s
  join subscription_plans sp on sp.id = s.plan_id
  where s.shop_id = new.shop_id
    and s.status = 'active'
  order by s.created_at desc
  limit 1;

  if not found then
    select c.is_service into v_is_service
    from shops sh
    left join categories c on c.id = sh.category_id
    where sh.id = new.shop_id;

    v_max := case when coalesce(v_is_service, false) then 3 else 15 end;
  end if;

  if v_max is not null then
    select count(*) into v_used from products where shop_id = new.shop_id;

    if v_used >= v_max then
      raise exception 'Llegaste al límite de % productos/servicios de tu plan actual. Mejorá tu suscripción para cargar más.', v_max
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_product_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_product_video_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_max integer;
  v_used integer;
begin
  if new.video_url is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.video_url is not null then
    return new;
  end if;

  select (sp.benefits ->> 'max_videos')::integer
    into v_max
  from subscriptions s
  join subscription_plans sp on sp.id = s.plan_id
  where s.shop_id = new.shop_id
    and s.status = 'active'
  order by s.created_at desc
  limit 1;

  if not found then
    v_max := 3;
  end if;

  if v_max is not null then
    select count(*) into v_used
    from products
    where shop_id = new.shop_id
      and video_url is not null
      and id is distinct from new.id;

    if v_used >= v_max then
      raise exception 'Llegaste al límite de % productos con video de tu plan actual. Mejorá tu suscripción (Plan Básico o Ilimitado) para sumar más.', v_max
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_product_video_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_promotion_requires_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."enforce_promotion_requires_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_subscriptions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.subscriptions
    set status = 'expired'
    where status = 'active' and end_date < now();

  update public.shops
    set subscription_status = 'expired'
    where subscription_status = 'active'
      and subscription_expires_at < now();
end;
$$;


ALTER FUNCTION "public"."expire_subscriptions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_feed"("user_lat" double precision DEFAULT NULL::double precision, "user_lng" double precision DEFAULT NULL::double precision, "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0, "p_seed" "text" DEFAULT NULL::"text", "p_attribute_value" "text" DEFAULT NULL::"text") RETURNS TABLE("product_id" "uuid", "product_name" "text", "price" numeric, "shop_id" "uuid", "shop_name" "text", "shop_is_featured" boolean, "product_is_featured" boolean, "distance_km" double precision, "main_image" "text", "category_name" "text", "parent_category_name" "text", "attributes" "jsonb", "rubro_slug" "text", "shop_is_verified" boolean)
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
    (s.verification_status = 'verified' and s.subscription_status = 'active') as shop_is_verified
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


CREATE OR REPLACE FUNCTION "public"."get_shop_follow_stats"("p_shop_id" "uuid") RETURNS TABLE("follower_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*) as follower_count
  from public.shop_follows
  where shop_id = p_shop_id;
$$;


ALTER FUNCTION "public"."get_shop_follow_stats"("p_shop_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shop_rating"("p_shop_id" "uuid") RETURNS TABLE("avg_rating" numeric, "review_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    coalesce(round(avg(rating)::numeric, 1), 0) as avg_rating,
    count(*) as review_count
  from public.shop_reviews
  where shop_id = p_shop_id;
$$;


ALTER FUNCTION "public"."get_shop_rating"("p_shop_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shop_reviews"("p_shop_id" "uuid") RETURNS TABLE("id" "uuid", "rating" smallint, "comment" "text", "created_at" timestamp with time zone, "client_id" "uuid", "client_name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    sr.id,
    sr.rating,
    sr.comment,
    sr.created_at,
    sr.client_id,
    coalesce(p.full_name, 'Usuario') as client_name
  from public.shop_reviews sr
  left join public.profiles p on p.id = sr.client_id
  where sr.shop_id = p_shop_id
  order by sr.created_at desc
  limit 50;
$$;


ALTER FUNCTION "public"."get_shop_reviews"("p_shop_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."immutable_unaccent"("text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    AS $_$
  select public.unaccent($1)
$_$;


ALTER FUNCTION "public"."immutable_unaccent"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_shop_metric"("p_shop_id" "uuid", "p_metric" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_ip text;
  v_allowed boolean;
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.shops where id = p_shop_id;

  if v_owner_id is not null and v_owner_id = auth.uid() then
    return;
  end if;

  v_ip := coalesce(
    nullif(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), ''),
    'unknown'
  );

  v_allowed := public.check_rate_limit('ip:' || v_ip, 'metric:' || p_metric || ':' || p_shop_id::text, 1, 15);

  if not v_allowed then
    return;
  end if;

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


ALTER FUNCTION "public"."increment_shop_metric"("p_shop_id" "uuid", "p_metric" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'superadmin'
  );
$$;


ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_metadata);
end;
$$;


ALTER FUNCTION "public"."log_admin_action"("p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_admin_notifications_read"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  update public.admin_notifications
  set is_read = true
  where is_read = false;
end;
$$;


ALTER FUNCTION "public"."mark_all_admin_notifications_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_client_notifications_read"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.client_notifications
  set is_read = true
  where client_id = auth.uid() and is_read = false;
end;
$$;


ALTER FUNCTION "public"."mark_client_notifications_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_category_text"("p_text" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select trim(regexp_replace(lower(public.immutable_unaccent(p_text)), '[^a-z0-9]+', ' ', 'g'));
$$;


ALTER FUNCTION "public"."normalize_category_text"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admin_new_shop_report"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.admin_notifications (type, reference_id)
  values ('new_report', new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_admin_new_shop_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admin_new_subscription_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.admin_notifications (type, reference_id)
  values ('new_subscription_request', new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_admin_new_subscription_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admin_pending_shop_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.verification_status = 'pending'
     and (tg_op = 'INSERT' or old.verification_status is distinct from 'pending') then
    insert into public.admin_notifications (type, reference_id)
    values ('new_verification_request', new.id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_admin_pending_shop_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_shop_followers_new_product"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."notify_shop_followers_new_product"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_shop_admin_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_superadmin() then
    new.verification_status := old.verification_status;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
    new.subscription_status := old.subscription_status;
    new.subscription_expires_at := old.subscription_expires_at;
    new.is_active := old.is_active;
    new.suspended_reason := old.suspended_reason;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."protect_shop_admin_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_category_suggestion"("p_suggestion_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede rechazar categorías';
  end if;

  update category_suggestions
  set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_suggestion_id and status = 'pending';
end;
$$;


ALTER FUNCTION "public"."reject_category_suggestion"("p_suggestion_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_shop_verification"("p_shop_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede rechazar la verificación de un comercio';
  end if;

  update public.shops
  set verification_status = 'rejected',
      updated_at = now()
  where id = p_shop_id;
end;
$$;


ALTER FUNCTION "public"."reject_shop_verification"("p_shop_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_subscription"("p_subscription_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede rechazar suscripciones';
  end if;

  update public.subscriptions
  set status = 'rejected',
      rejection_reason = p_reason
  where id = p_subscription_id;
end;
$$;


ALTER FUNCTION "public"."reject_subscription"("p_subscription_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_shop_location"("p_shop_id" "uuid", "p_lat" double precision, "p_lng" double precision) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.shops
  set location = st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      updated_at = now()
  where id = p_shop_id
    and (owner_id = auth.uid() or public.is_superadmin());
end;
$$;


ALTER FUNCTION "public"."set_shop_location"("p_shop_id" "uuid", "p_lat" double precision, "p_lng" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."suspend_shop"("p_shop_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede suspender un comercio';
  end if;

  update public.shops
  set is_active = false,
      suspended_reason = p_reason,
      updated_at = now()
  where id = p_shop_id;
end;
$$;


ALTER FUNCTION "public"."suspend_shop"("p_shop_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_shop_subscription_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."sync_shop_subscription_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unsuspend_shop"("p_shop_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede reactivar un comercio';
  end if;

  update public.shops
  set is_active = true,
      suspended_reason = null,
      updated_at = now()
  where id = p_shop_id;
end;
$$;


ALTER FUNCTION "public"."unsuspend_shop"("p_shop_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "target_table" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon_url" "text",
    "parent_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_service" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_attributes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "type" "text" NOT NULL,
    "options" "jsonb",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "category_attributes_type_check" CHECK (("type" = ANY (ARRAY['select'::"text", 'multiselect'::"text", 'text'::"text", 'number'::"text", 'multicolor'::"text"])))
);


ALTER TABLE "public"."category_attributes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "rejection_reason" "text",
    "resulting_category_id" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "category_suggestions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."category_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "client_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_attribute_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "attribute_id" "uuid" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."product_attribute_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'ARS'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"spanish"'::"regconfig", "public"."immutable_unaccent"(((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))))) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "video_url" "text",
    "is_featured" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role",
    "full_name" "text",
    "avatar_url" "text",
    "phone" "text",
    "city" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_events" (
    "id" bigint NOT NULL,
    "actor" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limit_events" OWNER TO "postgres";


ALTER TABLE "public"."rate_limit_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."rate_limit_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shop_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_promotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "image_url" "text" NOT NULL,
    "text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "text_position" "text" DEFAULT 'bottom'::"text" NOT NULL,
    "text_size" "text" DEFAULT 'md'::"text" NOT NULL,
    "text_color" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "bg_color" "text" DEFAULT '#000000'::"text" NOT NULL,
    CONSTRAINT "shop_promotions_text_position_check" CHECK (("text_position" = ANY (ARRAY['top'::"text", 'center'::"text", 'bottom'::"text"]))),
    CONSTRAINT "shop_promotions_text_size_check" CHECK (("text_size" = ANY (ARRAY['sm'::"text", 'md'::"text", 'lg'::"text"])))
);


ALTER TABLE "public"."shop_promotions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "reported_by" "uuid",
    "reason" "public"."report_reason" NOT NULL,
    "comment" "text",
    "status" "public"."report_status" DEFAULT 'pending'::"public"."report_status" NOT NULL,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shop_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shop_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."shop_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shops" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "cover_url" "text",
    "whatsapp_number" "text" NOT NULL,
    "email" "text",
    "instagram_url" "text",
    "address" "text",
    "location" "public"."geography"(Point,4326),
    "city" "text",
    "verification_status" "public"."verification_status" DEFAULT 'pending'::"public"."verification_status" NOT NULL,
    "verification_document_url" "text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "subscription_status" "public"."subscription_status" DEFAULT 'none'::"public"."subscription_status" NOT NULL,
    "subscription_expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_hours" "jsonb",
    "is_paused" boolean DEFAULT false NOT NULL,
    "paused_reason" "text",
    "profile_views" bigint DEFAULT 0 NOT NULL,
    "whatsapp_clicks" bigint DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "suspended_reason" "text",
    "facebook_url" "text",
    "website_url" "text",
    "accent_color" "text",
    "landing_banner" "jsonb",
    "landing_services" "jsonb",
    "landing_video_url" "text",
    CONSTRAINT "shops_accent_color_check" CHECK ((("accent_color" IS NULL) OR ("accent_color" = ANY (ARRAY['violet'::"text", 'rose'::"text", 'orange'::"text", 'amber'::"text", 'emerald'::"text", 'sky'::"text", 'pink'::"text"]))))
);


ALTER TABLE "public"."shops" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "duration_days" integer NOT NULL,
    "benefits" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applies_to" "text" DEFAULT 'all'::"text" NOT NULL,
    CONSTRAINT "subscription_plans_applies_to_check" CHECK (("applies_to" = ANY (ARRAY['all'::"text", 'product'::"text", 'service'::"text"])))
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'pending'::"public"."subscription_status" NOT NULL,
    "payment_proof_url" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "galiopay_reference_id" "text",
    "galiopay_link_id" "text",
    "galiopay_proof_token" "text",
    "galiopay_checkout_url" "text",
    "galiopay_status" "text"
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_notifications"
    ADD CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."category_attributes"
    ADD CONSTRAINT "category_attributes_category_id_key_key" UNIQUE ("category_id", "key");



ALTER TABLE ONLY "public"."category_attributes"
    ADD CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_suggestions"
    ADD CONSTRAINT "category_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_notifications"
    ADD CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("client_id", "product_id");



ALTER TABLE ONLY "public"."product_attribute_values"
    ADD CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_events"
    ADD CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_contacts"
    ADD CONSTRAINT "shop_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_follows"
    ADD CONSTRAINT "shop_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_follows"
    ADD CONSTRAINT "shop_follows_shop_id_client_id_key" UNIQUE ("shop_id", "client_id");



ALTER TABLE ONLY "public"."shop_promotions"
    ADD CONSTRAINT "shop_promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_reports"
    ADD CONSTRAINT "shop_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_reviews"
    ADD CONSTRAINT "shop_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_reviews"
    ADD CONSTRAINT "shop_reviews_shop_id_client_id_key" UNIQUE ("shop_id", "client_id");



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



CREATE INDEX "category_suggestions_status_idx" ON "public"."category_suggestions" USING "btree" ("status");



CREATE INDEX "idx_client_notifications_client_id" ON "public"."client_notifications" USING "btree" ("client_id", "is_read");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_is_featured" ON "public"."products" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_products_search" ON "public"."products" USING "gin" ("search_vector");



CREATE INDEX "idx_products_shop" ON "public"."products" USING "btree" ("shop_id");



CREATE INDEX "idx_rate_limit_events_actor_action" ON "public"."rate_limit_events" USING "btree" ("actor", "action", "created_at" DESC);



CREATE INDEX "idx_shop_contacts_client_id" ON "public"."shop_contacts" USING "btree" ("client_id", "created_at" DESC);



CREATE INDEX "idx_shop_follows_client_id" ON "public"."shop_follows" USING "btree" ("client_id");



CREATE INDEX "idx_shop_follows_shop_id" ON "public"."shop_follows" USING "btree" ("shop_id");



CREATE INDEX "idx_shop_reviews_shop_id" ON "public"."shop_reviews" USING "btree" ("shop_id");



CREATE INDEX "idx_shops_category" ON "public"."shops" USING "btree" ("category_id");



CREATE INDEX "idx_shops_location" ON "public"."shops" USING "gist" ("location");



CREATE INDEX "idx_shops_search" ON "public"."shops" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_shops_slug" ON "public"."shops" USING "btree" ("slug");



CREATE UNIQUE INDEX "idx_subscriptions_galiopay_reference" ON "public"."subscriptions" USING "btree" ("galiopay_reference_id") WHERE ("galiopay_reference_id" IS NOT NULL);



CREATE INDEX "idx_subscriptions_shop" ON "public"."subscriptions" USING "btree" ("shop_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "product_attribute_values_attribute_id_idx" ON "public"."product_attribute_values" USING "btree" ("attribute_id");



CREATE INDEX "product_attribute_values_lookup_idx" ON "public"."product_attribute_values" USING "btree" ("attribute_id", "value");



CREATE INDEX "product_attribute_values_product_id_idx" ON "public"."product_attribute_values" USING "btree" ("product_id");



CREATE INDEX "product_variants_product_id_idx" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "products_search_vector_idx" ON "public"."products" USING "gin" ("search_vector");



CREATE INDEX "products_shop_id_updated_at_idx" ON "public"."products" USING "btree" ("shop_id", "updated_at");



CREATE INDEX "shop_promotions_expires_at_idx" ON "public"."shop_promotions" USING "btree" ("expires_at");



CREATE INDEX "shop_promotions_shop_id_idx" ON "public"."shop_promotions" USING "btree" ("shop_id");



CREATE OR REPLACE TRIGGER "trg_enforce_product_limit" BEFORE INSERT ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_product_limit"();



CREATE OR REPLACE TRIGGER "trg_enforce_product_video_limit" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_product_video_limit"();



CREATE OR REPLACE TRIGGER "trg_enforce_promotion_requires_subscription" BEFORE INSERT ON "public"."shop_promotions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_promotion_requires_subscription"();



CREATE OR REPLACE TRIGGER "trg_notify_new_shop_report" AFTER INSERT ON "public"."shop_reports" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admin_new_shop_report"();



CREATE OR REPLACE TRIGGER "trg_notify_new_subscription" AFTER INSERT ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admin_new_subscription_request"();



CREATE OR REPLACE TRIGGER "trg_notify_shop_followers_new_product" AFTER INSERT OR UPDATE OF "is_active" ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."notify_shop_followers_new_product"();



CREATE OR REPLACE TRIGGER "trg_notify_shop_verification" AFTER INSERT OR UPDATE ON "public"."shops" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admin_pending_shop_verification"();



CREATE OR REPLACE TRIGGER "trg_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_protect_shop_admin_columns" BEFORE UPDATE ON "public"."shops" FOR EACH ROW EXECUTE FUNCTION "public"."protect_shop_admin_columns"();



CREATE OR REPLACE TRIGGER "trg_shop_reviews_updated_at" BEFORE UPDATE ON "public"."shop_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_shops_updated_at" BEFORE UPDATE ON "public"."shops" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_shop_subscription" AFTER INSERT OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."sync_shop_subscription_status"();



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."category_attributes"
    ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_suggestions"
    ADD CONSTRAINT "category_suggestions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."category_suggestions"
    ADD CONSTRAINT "category_suggestions_resulting_category_id_fkey" FOREIGN KEY ("resulting_category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."category_suggestions"
    ADD CONSTRAINT "category_suggestions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."category_suggestions"
    ADD CONSTRAINT "category_suggestions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_notifications"
    ADD CONSTRAINT "client_notifications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_attribute_values"
    ADD CONSTRAINT "product_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "public"."category_attributes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_attribute_values"
    ADD CONSTRAINT "product_attribute_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_contacts"
    ADD CONSTRAINT "shop_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_contacts"
    ADD CONSTRAINT "shop_contacts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shop_contacts"
    ADD CONSTRAINT "shop_contacts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_follows"
    ADD CONSTRAINT "shop_follows_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_follows"
    ADD CONSTRAINT "shop_follows_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_promotions"
    ADD CONSTRAINT "shop_promotions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shop_promotions"
    ADD CONSTRAINT "shop_promotions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_reports"
    ADD CONSTRAINT "shop_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."shop_reports"
    ADD CONSTRAINT "shop_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."shop_reports"
    ADD CONSTRAINT "shop_reports_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_reviews"
    ADD CONSTRAINT "shop_reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_reviews"
    ADD CONSTRAINT "shop_reviews_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shops"
    ADD CONSTRAINT "shops_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE CASCADE;



ALTER TABLE "public"."admin_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias son públicas" ON "public"."categories" FOR SELECT USING (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_attributes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_attributes_select_public" ON "public"."category_attributes" FOR SELECT USING (true);



CREATE POLICY "category_attributes_write_superadmin" ON "public"."category_attributes" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



ALTER TABLE "public"."category_suggestions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_suggestions_insert_shop_owner" ON "public"."category_suggestions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "category_suggestions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "category_suggestions_select" ON "public"."category_suggestions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "category_suggestions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))) OR "public"."is_superadmin"()));



CREATE POLICY "category_suggestions_update_superadmin" ON "public"."category_suggestions" FOR UPDATE USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



ALTER TABLE "public"."client_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_notifications_select_own" ON "public"."client_notifications" FOR SELECT TO "authenticated" USING (("client_id" = "auth"."uid"()));



CREATE POLICY "client_notifications_update_own" ON "public"."client_notifications" FOR UPDATE TO "authenticated" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "cliente gestiona sus favoritos" ON "public"."favorites" USING (("client_id" = "auth"."uid"()));



CREATE POLICY "cualquiera puede reportar" ON "public"."shop_reports" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "planes son públicos" ON "public"."subscription_plans" FOR SELECT USING ((("is_active" = true) OR "public"."is_superadmin"()));



ALTER TABLE "public"."product_attribute_values" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_attribute_values_delete_shop_owner" ON "public"."product_attribute_values" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_attribute_values"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "product_attribute_values_insert_shop_owner" ON "public"."product_attribute_values" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_attribute_values"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "product_attribute_values_select_visible" ON "public"."product_attribute_values" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_attribute_values"."product_id") AND ((("p"."is_active" = true) AND ("s"."is_active" = true) AND ("s"."is_paused" = false) AND ("s"."deleted_at" IS NULL)) OR ("s"."owner_id" = "auth"."uid"()) OR "public"."is_superadmin"())))));



ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_images_delete_shop_owner" ON "public"."product_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_images"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "product_images_insert_shop_owner" ON "public"."product_images" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_images"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "product_images_select_visible" ON "public"."product_images" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_images"."product_id") AND ((("p"."is_active" = true) AND ("s"."is_active" = true) AND ("s"."is_paused" = false) AND ("s"."deleted_at" IS NULL)) OR ("s"."owner_id" = "auth"."uid"()) OR "public"."is_superadmin"())))));



CREATE POLICY "product_images_update_shop_owner" ON "public"."product_images" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_images"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_variants_delete_shop_owner" ON "public"."product_variants" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "product_variants_insert_shop_owner" ON "public"."product_variants" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "product_variants_select_visible" ON "public"."product_variants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_variants"."product_id") AND ((("p"."is_active" = true) AND ("s"."is_active" = true) AND ("s"."is_paused" = false) AND ("s"."deleted_at" IS NULL)) OR ("s"."owner_id" = "auth"."uid"()) OR "public"."is_superadmin"())))));



CREATE POLICY "product_variants_update_shop_owner" ON "public"."product_variants" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."shops" "s" ON (("s"."id" = "p"."shop_id")))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "productos públicos" ON "public"."products" FOR SELECT USING ((("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "products"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))) OR "public"."is_superadmin"()));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_select_superadmin" ON "public"."products" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"());



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop admin borra sus productos" ON "public"."products" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "products"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "shop admin crea su propio shop" ON "public"."shops" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "shop admin edita su propio shop" ON "public"."shops" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR "public"."is_superadmin"()));



CREATE POLICY "shop admin edita sus productos" ON "public"."products" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "products"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))) OR "public"."is_superadmin"()));



CREATE POLICY "shop admin gestiona sus productos" ON "public"."products" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "products"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "shop crea solicitud de subscripción" ON "public"."subscriptions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "subscriptions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "shop ve sus subscripciones" ON "public"."subscriptions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "subscriptions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))) OR "public"."is_superadmin"()));



ALTER TABLE "public"."shop_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_contacts_insert_own" ON "public"."shop_contacts" FOR INSERT TO "authenticated" WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "shop_contacts_select_own" ON "public"."shop_contacts" FOR SELECT TO "authenticated" USING (("client_id" = "auth"."uid"()));



CREATE POLICY "shop_contacts_select_shop_owner" ON "public"."shop_contacts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "shop_contacts"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "shop_contacts_select_superadmin" ON "public"."shop_contacts" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"());



ALTER TABLE "public"."shop_follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_follows_delete_own" ON "public"."shop_follows" FOR DELETE TO "authenticated" USING (("client_id" = "auth"."uid"()));



CREATE POLICY "shop_follows_insert_own" ON "public"."shop_follows" FOR INSERT TO "authenticated" WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "shop_follows_select_own" ON "public"."shop_follows" FOR SELECT TO "authenticated" USING (("client_id" = "auth"."uid"()));



ALTER TABLE "public"."shop_promotions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_promotions_delete_shop_owner" ON "public"."shop_promotions" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "shop_promotions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))) OR "public"."is_superadmin"()));



CREATE POLICY "shop_promotions_insert_shop_owner" ON "public"."shop_promotions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "shop_promotions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))));



CREATE POLICY "shop_promotions_select_visible" ON "public"."shop_promotions" FOR SELECT USING (((("expires_at" > "now"()) AND (EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "shop_promotions"."shop_id") AND ("s"."is_active" = true) AND ("s"."is_paused" = false) AND ("s"."deleted_at" IS NULL))))) OR (EXISTS ( SELECT 1
   FROM "public"."shops" "s"
  WHERE (("s"."id" = "shop_promotions"."shop_id") AND ("s"."owner_id" = "auth"."uid"())))) OR "public"."is_superadmin"()));



ALTER TABLE "public"."shop_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shop_reviews_delete_own" ON "public"."shop_reviews" FOR DELETE TO "authenticated" USING ((("client_id" = "auth"."uid"()) OR "public"."is_superadmin"()));



CREATE POLICY "shop_reviews_insert_own" ON "public"."shop_reviews" FOR INSERT TO "authenticated" WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "shop_reviews_select_public" ON "public"."shop_reviews" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "shop_reviews_update_own" ON "public"."shop_reviews" FOR UPDATE TO "authenticated" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



ALTER TABLE "public"."shops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shops activos son públicos" ON "public"."shops" FOR SELECT USING ((("is_active" = true) OR ("owner_id" = "auth"."uid"()) OR "public"."is_superadmin"()));



CREATE POLICY "solo superadmin actualiza reportes" ON "public"."shop_reports" FOR UPDATE USING ("public"."is_superadmin"());



CREATE POLICY "solo superadmin aprueba subscripciones" ON "public"."subscriptions" FOR UPDATE USING ("public"."is_superadmin"());



CREATE POLICY "solo superadmin crea categorias" ON "public"."categories" FOR INSERT WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "solo superadmin edita categorias" ON "public"."categories" FOR UPDATE USING ("public"."is_superadmin"());



CREATE POLICY "solo superadmin escribe audit log" ON "public"."audit_log" FOR INSERT WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "solo superadmin gestiona planes" ON "public"."subscription_plans" USING ("public"."is_superadmin"());



CREATE POLICY "solo superadmin lee audit log" ON "public"."audit_log" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "solo superadmin ve notificaciones" ON "public"."admin_notifications" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "solo superadmin ve y gestiona reportes" ON "public"."shop_reports" FOR SELECT USING ("public"."is_superadmin"());



ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios actualizan su propio perfil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "usuarios ven y editan su propio perfil" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_superadmin"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_shop_plan"("p_shop_id" "uuid", "p_plan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_shop_plan"("p_shop_id" "uuid", "p_plan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_shop_plan"("p_shop_id" "uuid", "p_plan_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_category_suggestion"("p_suggestion_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_category_suggestion"("p_suggestion_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_category_suggestion"("p_suggestion_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_shop_verification"("p_shop_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_shop_verification"("p_shop_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_shop_verification"("p_shop_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_subscription"("p_subscription_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_subscription"("p_subscription_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_subscription"("p_subscription_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."approve_subscription_by_payment"("p_subscription_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_subscription_by_payment"("p_subscription_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_rate_limit"("p_actor" "text", "p_action" "text", "p_max_count" integer, "p_window_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_actor" "text", "p_action" "text", "p_max_count" integer, "p_window_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_actor" "text", "p_action" "text", "p_max_count" integer, "p_window_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_actor" "text", "p_action" "text", "p_max_count" integer, "p_window_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_product_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_product_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_product_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_product_video_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_product_video_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_product_video_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_promotion_requires_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_promotion_requires_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_promotion_requires_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_subscriptions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_feed"("user_lat" double precision, "user_lng" double precision, "p_category_id" "uuid", "p_search" "text", "p_limit" integer, "p_offset" integer, "p_seed" "text", "p_attribute_value" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_shop_follow_stats"("p_shop_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_shop_follow_stats"("p_shop_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_follow_stats"("p_shop_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_follow_stats"("p_shop_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_shop_rating"("p_shop_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_shop_rating"("p_shop_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_rating"("p_shop_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_rating"("p_shop_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_shop_reviews"("p_shop_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_shop_reviews"("p_shop_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_reviews"("p_shop_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_reviews"("p_shop_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_shop_metric"("p_shop_id" "uuid", "p_metric" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_shop_metric"("p_shop_id" "uuid", "p_metric" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_shop_metric"("p_shop_id" "uuid", "p_metric" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_all_admin_notifications_read"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_all_admin_notifications_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_admin_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_admin_notifications_read"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_client_notifications_read"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_client_notifications_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_client_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_client_notifications_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_category_text"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_category_text"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_category_text"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_new_shop_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_new_shop_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_new_shop_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_new_subscription_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_new_subscription_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_new_subscription_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_pending_shop_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_pending_shop_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_pending_shop_verification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_shop_followers_new_product"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_shop_followers_new_product"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_shop_followers_new_product"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_shop_admin_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_shop_admin_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_shop_admin_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_category_suggestion"("p_suggestion_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_category_suggestion"("p_suggestion_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_category_suggestion"("p_suggestion_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_shop_verification"("p_shop_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_shop_verification"("p_shop_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_shop_verification"("p_shop_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_subscription"("p_subscription_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_subscription"("p_subscription_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_subscription"("p_subscription_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_shop_location"("p_shop_id" "uuid", "p_lat" double precision, "p_lng" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."set_shop_location"("p_shop_id" "uuid", "p_lat" double precision, "p_lng" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_shop_location"("p_shop_id" "uuid", "p_lat" double precision, "p_lng" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."suspend_shop"("p_shop_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."suspend_shop"("p_shop_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."suspend_shop"("p_shop_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."suspend_shop"("p_shop_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_shop_subscription_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_shop_subscription_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_shop_subscription_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."unsuspend_shop"("p_shop_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."unsuspend_shop"("p_shop_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unsuspend_shop"("p_shop_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unsuspend_shop"("p_shop_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."admin_notifications" TO "anon";
GRANT ALL ON TABLE "public"."admin_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."category_attributes" TO "anon";
GRANT ALL ON TABLE "public"."category_attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."category_attributes" TO "service_role";



GRANT ALL ON TABLE "public"."category_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."category_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."category_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."client_notifications" TO "anon";
GRANT ALL ON TABLE "public"."client_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."client_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."product_attribute_values" TO "anon";
GRANT ALL ON TABLE "public"."product_attribute_values" TO "authenticated";
GRANT ALL ON TABLE "public"."product_attribute_values" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_events" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rate_limit_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rate_limit_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rate_limit_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shop_contacts" TO "anon";
GRANT ALL ON TABLE "public"."shop_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."shop_follows" TO "anon";
GRANT ALL ON TABLE "public"."shop_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_follows" TO "service_role";



GRANT ALL ON TABLE "public"."shop_promotions" TO "anon";
GRANT ALL ON TABLE "public"."shop_promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_promotions" TO "service_role";



GRANT ALL ON TABLE "public"."shop_reports" TO "anon";
GRANT ALL ON TABLE "public"."shop_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_reports" TO "service_role";



GRANT ALL ON TABLE "public"."shop_reviews" TO "anon";
GRANT ALL ON TABLE "public"."shop_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."shops" TO "anon";
GRANT ALL ON TABLE "public"."shops" TO "authenticated";
GRANT ALL ON TABLE "public"."shops" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







