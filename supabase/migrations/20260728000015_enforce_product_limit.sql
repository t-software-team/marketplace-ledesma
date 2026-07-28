-- Enforce subscription product/service limits at the database level.
-- The Server Action already blocks this in the UI, but RLS alone doesn't
-- stop someone from inserting directly via the Supabase REST API with
-- their own session token — this trigger closes that gap.

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_used integer;
  v_free_plan_max constant integer := 30;
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

  -- null max_products means unlimited
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

drop trigger if exists trg_enforce_product_limit on products;

create trigger trg_enforce_product_limit
  before insert on products
  for each row
  execute function public.enforce_product_limit();
