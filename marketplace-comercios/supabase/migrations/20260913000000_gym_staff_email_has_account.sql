-- The invite-accept page needs to know whether the invited email already has
-- an account, to send the person to /login (existing account) or /registro
-- (brand-new). auth.users isn't reachable from PostgREST (public schema
-- only), so this security-definer function bridges that lookup. Execute is
-- restricted to service_role: this must only ever be called from trusted
-- server code (getGymStaffInvitePreview), never exposed to a logged-out
-- visitor directly — it would otherwise let anyone enumerate registered
-- emails.
--
-- Only a *confirmed* account counts as "has account". A signup that was
-- started but never confirmed (e.g. someone tried to register, closed the
-- tab before clicking the email link) has no usable password on the login
-- screen — routing it to /login there is a dead end. Sending it to /registro
-- instead lets Supabase's signUp resend the confirmation email for that same
-- unconfirmed user (no duplicate created).
create or replace function public.email_has_account(p_email text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(p_email) and email_confirmed_at is not null
  );
$$;

alter function public.email_has_account(text) owner to postgres;

revoke all on function public.email_has_account(text) from public, anon, authenticated;
grant execute on function public.email_has_account(text) to service_role;
