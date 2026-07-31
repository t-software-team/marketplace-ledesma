-- ============================================================
-- 20260731000003_product_video_plan_limit.sql
-- Plan Free: hasta 3 productos/servicios con video propio. Para
-- subir video en más productos (o cambiar cuál lo tiene) hace
-- falta Plan Básico (Plan 50) o Plan Ilimitado, que quedan sin
-- límite. Mismo patrón que enforce_product_limit: trigger server-
-- side (no confiar solo en la UI) leyendo benefits->>'max_videos'.
-- ============================================================

update public.subscription_plans
set benefits = jsonb_set(benefits, '{max_videos}', '3')
where id = '11111111-1111-1111-1111-111111111111'; -- Free

update public.subscription_plans
set benefits = jsonb_set(benefits, '{max_videos}', 'null')
where id in (
  '22222222-2222-2222-2222-222222222222', -- Plan 50 / Básico
  '33333333-4444-4444-4444-444444444444', -- Plan Ilimitado
  '44444444-5555-5555-5555-555555555555'  -- Plan Plus
);

create or replace function public.enforce_product_video_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

drop trigger if exists trg_enforce_product_video_limit on public.products;

create trigger trg_enforce_product_video_limit
  before insert or update on public.products
  for each row
  execute function public.enforce_product_video_limit();
