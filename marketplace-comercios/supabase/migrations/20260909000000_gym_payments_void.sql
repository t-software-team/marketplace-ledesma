-- Lets the gym owner correct a mis-entered payment without deleting history:
-- a payment is marked 'voided' (with a reason) instead of removed, so caja
-- stays auditable. get_gym_dashboard_stats already filters status='paid',
-- so a voided payment stops counting toward revenue automatically.
alter table public.gym_payments
  drop constraint if exists gym_payments_status_check,
  add constraint gym_payments_status_check check (status in ('paid', 'pending', 'failed', 'voided'));

alter table public.gym_payments
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id) on delete set null;
