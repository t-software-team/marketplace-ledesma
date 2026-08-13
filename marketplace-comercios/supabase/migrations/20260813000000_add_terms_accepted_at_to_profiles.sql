-- Add terms_accepted_at to profiles to record when a user accepted the
-- Términos y Condiciones during onboarding role selection.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;
