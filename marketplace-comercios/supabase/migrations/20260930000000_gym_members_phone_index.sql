-- The self-checkin kiosk matches a typed digit suffix against member phones on
-- every keystroke. A leading-wildcard LIKE '%1234' can't use a btree index, so
-- we store the digits reversed: a suffix search on the phone becomes a prefix
-- search on the reversed digits, which a plain btree index can serve.
alter table public.gym_members
  add column if not exists phone_digits_reversed text
    generated always as (reverse(regexp_replace(coalesce(phone, ''), '\D', '', 'g'))) stored;

comment on column public.gym_members.phone_digits_reversed is
  'Digits-only phone, reversed, so a suffix match on the typed digits becomes an index-able prefix match.';

create index if not exists idx_gym_members_phone_digits_reversed
  on public.gym_members (shop_id, phone_digits_reversed)
  where phone is not null and is_archived = false;
