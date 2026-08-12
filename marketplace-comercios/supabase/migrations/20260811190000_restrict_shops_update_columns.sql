-- Cierra un gap de seguridad: la policy RLS de UPDATE en "shops"
-- ("shop admin edita su propio shop") solo valida ownership
-- (owner_id = auth.uid()), no qué columnas se tocan. Combinado con el
-- GRANT ALL ON TABLE shops TO authenticated de la migración baseline, un
-- shop_admin autenticado podía saltarse la UI y llamar directo a la API de
-- Supabase para setear verification_status/subscription_status a mano —
-- auto-verificándose o dándose un plan pago activo sin pagar.
--
-- Los cambios legítimos a esas columnas ya pasan por RPCs security definer
-- (approve_shop_verification, suspend_shop, unsuspend_shop,
-- approve_subscription_by_payment, approve_subscription, set_shop_location,
-- increment_shop_metric), que corren con los privilegios del dueño de la
-- función y no dependen de estos GRANT. Revocamos el UPDATE directo del rol
-- authenticated y se lo volvemos a otorgar solo sobre las columnas que el
-- código de la app efectivamente actualiza a mano (updateShopSettings,
-- updateShopPersonalization, updateVerificationDocument).

revoke update on table "public"."shops" from "authenticated";

grant update (
  "name",
  "slug",
  "description",
  "logo_url",
  "cover_url",
  "whatsapp_number",
  "email",
  "instagram_url",
  "address",
  "city",
  "category_id",
  "business_hours",
  "is_paused",
  "paused_reason",
  "facebook_url",
  "website_url",
  "accent_color",
  "landing_banner",
  "landing_services",
  "landing_gallery",
  "landing_video_url",
  "verification_document_url"
) on table "public"."shops" to "authenticated";
