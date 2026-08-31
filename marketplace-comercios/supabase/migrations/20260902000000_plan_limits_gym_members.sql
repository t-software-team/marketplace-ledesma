-- Freemium cap for gym members. Mirrors max_products_service et al: the limit
-- lives in plan_limits per plan_id, null = unlimited. Free plans cap the roster
-- at 20 active members; paid plans stay unlimited unless a value is set. The
-- paid "Plan Gimnasio" (applies_to = service) is created from /admin.
alter table public.plan_limits add column if not exists max_gym_members integer;

update public.plan_limits pl
set max_gym_members = 20
from public.subscription_plans sp
where sp.id = pl.plan_id and sp.price = 0;
