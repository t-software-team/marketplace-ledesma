-- Soporte para Mercado Pago como segundo método de pago de suscripciones
-- (Checkout Pro, pago único repetido cada mes — mismo modelo que GalioPay,
-- no suscripción recurrente real de MP). payment_provider distingue con qué
-- proveedor se generó cada fila para saber cómo sincronizarla.

alter table "public"."subscriptions"
  add column "payment_provider" text,
  add column "mercadopago_reference_id" text,
  add column "mercadopago_preference_id" text,
  add column "mercadopago_payment_id" text,
  add column "mercadopago_checkout_url" text,
  add column "mercadopago_status" text;

alter table "public"."subscriptions"
  add constraint "subscriptions_payment_provider_check"
  check (("payment_provider" is null) or ("payment_provider" = any (array['galiopay', 'mercadopago'])));
