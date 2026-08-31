-- The invite-accept page needs to know whether the invited email already has
-- an account, to send the person to /login (existing account) or /registro
-- (brand-new). auth.users isn't reachable from PostgREST (public schema
-- only), so this security-definer function bridges that lookup. Execute is
-- restricted to service_role: this must only ever be called from trusted
-- server code (getGymStaffInvitePreview), never exposed to a logged-out
-- visitor directly — it would otherwise let anyone enumerate registered
-- emails.
create or replace function public.email_has_account(p_email text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(p_email)
  );
$$;

alter function public.email_has_account(text) owner to postgres;

revoke all on function public.email_has_account(text) from public, anon, authenticated;
grant execute on function public.email_has_account(text) to service_role;
