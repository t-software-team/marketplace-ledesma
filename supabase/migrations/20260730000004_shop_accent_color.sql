-- Plan Ilimitado gets a "custom_branding" benefit that unlocks choosing an
-- accent color for the shop's public page (curated palette, not a free
-- color picker — keeps contrast/accessibility guaranteed by design).

alter table public.shops
  add column if not exists accent_color text;

alter table public.shops
  add constraint shops_accent_color_check
    check (accent_color is null or accent_color in (
      'violet', 'rose', 'orange', 'amber', 'emerald', 'sky', 'pink'
    ));

update public.subscription_plans
set benefits = jsonb_set(benefits, '{custom_branding}', 'true')
where id = '33333333-4444-4444-4444-444444444444'; -- Plan Ilimitado
