-- Optional category scoping for subscription plans.
--
-- Until now applies_to only distinguished product/service/all, so a "service"
-- plan showed to every service rubro. category_id lets a plan target one exact
-- category (e.g. Gimnasio): when set, the plan is offered only to shops of that
-- category; when null, it falls back to the applies_to behavior. Existing plans
-- keep category_id null, so their visibility is unchanged.
alter table public.subscription_plans
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists idx_subscription_plans_category
  on public.subscription_plans (category_id);
