-- The self check-in kiosk can queue entries while offline and sync them once
-- connectivity returns. Track those as their own source so the owner's audit
-- can tell "resolved live" from "resolved from a synced offline queue" —
-- useful when investigating a discrepancy (e.g. device clock drift).
alter table public.gym_check_ins
  drop constraint if exists gym_check_ins_source_check,
  add constraint gym_check_ins_source_check
    check (source in ('desk', 'self', 'self_offline'));
