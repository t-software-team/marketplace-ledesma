-- Promotions are a benefit of Plan 50 and Plan Ilimitado (not exclusive to
-- Plan Ilimitado like custom_branding). Free has no promotions.

update public.subscription_plans
set benefits = jsonb_set(benefits, '{promotions}', 'true')
where id in (
  '22222222-2222-2222-2222-222222222222', -- Plan 50
  '33333333-4444-4444-4444-444444444444'  -- Plan Ilimitado
);
