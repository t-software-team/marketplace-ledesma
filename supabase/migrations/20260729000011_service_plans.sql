-- Service rubros get a simpler 2-plan lineup (Free / Plus) instead of the
-- full 3-plan lineup meant for product businesses, with a lower free-tier
-- cap (3 vs 20). `categories.is_service` mirrors the app's SERVICE_RUBROS
-- set so the DB-side enforcement trigger doesn't need to guess.

alter table public.categories add column if not exists is_service boolean not null default false;

update public.categories
set is_service = true
where slug in (
  'peluquerias', 'talleres', 'salud-y-bienestar', 'alquileres', 'lavadero',
  'veterinaria', 'construccion', 'servicio-tecnico', 'tecnologia', 'bandas-musicales'
) and parent_id is null;

alter table public.subscription_plans
  add column if not exists applies_to text not null default 'all'
    check (applies_to in ('all', 'product', 'service'));

update public.subscription_plans set applies_to = 'all'
where id = '11111111-1111-1111-1111-111111111111'; -- Free

update public.subscription_plans set applies_to = 'product'
where id in (
  '22222222-2222-2222-2222-222222222222', -- Plan 100
  '33333333-4444-4444-4444-444444444444'  -- Plan Ilimitado
);

insert into public.subscription_plans (id, name, description, price, duration_days, benefits, is_active, applies_to)
values (
  '44444444-5555-5555-5555-555555555555',
  'Plan Plus',
  'Servicios ilimitados, reseñas de clientes y mejor posicionamiento en el feed.',
  5000,
  30,
  '{"max_products": null, "featured": true, "analytics": true}'::jsonb,
  true,
  'service'
)
on conflict (id) do nothing;

-- Free-tier cap now depends on whether the shop's rubro is a service rubro
-- (3) or not (20), instead of a flat 20 for everyone.
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

    v_max := case when coalesce(v_is_service, false) then 3 else 20 end;
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
