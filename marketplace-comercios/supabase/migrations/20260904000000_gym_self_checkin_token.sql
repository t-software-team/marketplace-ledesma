-- Public self check-in for gyms.
-- Each gym gets an opaque, rotatable token. The public self check-in page is
-- reached at /ingresos/<token>; the token is the only access secret, so it must
-- be unguessable and revocable. Inserts from the self check-in run through the
-- service role (no authenticated user), so RLS is intentionally left unchanged:
-- only the shop owner (or superadmin) can still read/write gym_check_ins
-- directly.
alter table public.shops
  add column if not exists gym_self_checkin_token uuid;

-- Fast, unique lookup by token (partial: most shops never enable self check-in).
create unique index if not exists idx_shops_gym_self_checkin_token
  on public.shops (gym_self_checkin_token)
  where gym_self_checkin_token is not null;
