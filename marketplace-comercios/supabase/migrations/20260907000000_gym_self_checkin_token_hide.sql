-- SECURITY: the self check-in token is a SECRET, but shops is world-readable —
-- the policy "shops activos son públicos" exposes every column of any active
-- shop to anon (and the anon key ships in the client bundle). A row-level policy
-- cannot hide a single column, so a naive SELECT could harvest every gym's token.
--
-- Fix: revoke SELECT/UPDATE on this one column from anon and authenticated. The
-- token is only ever read or written server-side through the service role (the
-- owner actions and the public self check-in page), which bypasses these grants.
-- All existing shops reads select explicit columns (never *), so none break.
revoke select (gym_self_checkin_token) on public.shops from anon, authenticated;
revoke update (gym_self_checkin_token) on public.shops from anon, authenticated;
