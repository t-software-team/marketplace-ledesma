-- Free plan drops from 30 to 20 products/services; "Plan 100" ($5000) is now
-- what a shop needs as soon as it goes over 20, not 30.

update public.subscription_plans
set
  description = 'Hasta 20 productos o servicios.',
  benefits = jsonb_set(benefits, '{max_products}', '20')
where id = '11111111-1111-1111-1111-111111111111';

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_used integer;
  v_free_plan_max constant integer := 20;
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
    v_max := v_free_plan_max;
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
