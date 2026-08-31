-- Evolve gym_check_ins from an "entries" log into an access log that also
-- records DENIED self check-in attempts, for the gym owner's audit:
--   - denied_expired    -> a known member whose membership has lapsed
--   - denied_not_found  -> digits that match no member (attempted_ref holds them)
-- member_id becomes nullable because an unknown-member attempt has no member to
-- reference. Existing rows default to an allowed desk entry, preserving history.
alter table public.gym_check_ins
  alter column member_id drop not null,
  add column if not exists outcome text not null default 'allowed',
  add column if not exists source text not null default 'desk',
  add column if not exists attempted_ref text;

alter table public.gym_check_ins
  drop constraint if exists gym_check_ins_outcome_check,
  add constraint gym_check_ins_outcome_check
    check (outcome in ('allowed', 'denied_expired', 'denied_not_found'));

alter table public.gym_check_ins
  drop constraint if exists gym_check_ins_source_check,
  add constraint gym_check_ins_source_check
    check (source in ('desk', 'self'));

-- Speeds up the "today, by outcome" audit reads and per-day denial dedup.
create index if not exists idx_gym_check_ins_shop_outcome_time
  on public.gym_check_ins (shop_id, outcome, checked_in_at desc);
