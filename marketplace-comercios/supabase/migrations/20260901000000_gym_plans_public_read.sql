-- Expose active gym plans publicly so a prospective member can see pricing on
-- the shop's public page. RLS policies are permissive (OR-combined), so this
-- adds a read path for active plans on top of the existing owner-only policy:
-- SELECT is allowed when is_active = true OR the caller owns the shop.
-- Inactive plans stay owner-only; writes are unaffected.
create policy "gym_plans_public_read_active" on public.gym_plans
  for select
  to anon, authenticated
  using (is_active = true);
