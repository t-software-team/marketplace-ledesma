-- The gym owner generates their own self check-in token (a random, rotatable
-- secret scoped to their own shop by RLS). It is not a privilege-escalation
-- vector like verification_status/subscription_status, so — like accent_color
-- or business_hours — the app updates it directly. Migration
-- 20260811190000_restrict_shops_update_columns revoked the broad UPDATE and
-- re-granted it per column; this adds the new column to that allow-list.
-- Column-level grants are additive, so existing grants are untouched.
grant update ("gym_self_checkin_token") on table "public"."shops" to "authenticated";
