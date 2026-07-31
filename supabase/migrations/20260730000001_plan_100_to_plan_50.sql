-- "Plan 100" becomes "Plan 50": same price, half the product cap. Plan
-- Ilimitado stays unlimited (benefits.max_products already null).
--
-- Descriptions no longer repeat the product count in free text — the
-- benefits.max_products value (rendered as "Hasta X productos" or
-- "productos ilimitados" by the UI) is now the single source of truth, so
-- the two can't drift out of sync again.

update public.subscription_plans
set
  name = 'Plan 50',
  description = 'Con destacado en el feed.',
  benefits = jsonb_set(benefits, '{max_products}', '50')
where id = '22222222-2222-2222-2222-222222222222';

-- Free plan (product rubros) drops from 20 to 15, matching the app-level
-- cap already in src/lib/shops/queries.ts. Service rubros keep their 3 cap.

update public.subscription_plans
set
  description = null,
  benefits = jsonb_set(benefits, '{max_products}', '15')
where id = '11111111-1111-1111-1111-111111111111';

update public.subscription_plans
set description = 'Sin límite, con destacado y soporte prioritario.'
where id = '33333333-4444-4444-4444-444444444444'; -- Plan Ilimitado

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
