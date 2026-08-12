-- Además de vencer suscripciones activas cuya fecha pasó, limpia las
-- "pending" abandonadas (el usuario creó el checkout de GalioPay/Mercado
-- Pago y nunca pagó ni volvió) para que no se acumulen sin límite. 48hs de
-- margen es de sobra para completar un pago; después se considera
-- abandonada y pasa a expired.

CREATE OR REPLACE FUNCTION "public"."expire_subscriptions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.subscriptions
    set status = 'expired'
    where status = 'active' and end_date < now();

  update public.subscriptions
    set status = 'expired'
    where status = 'pending' and created_at < now() - interval '48 hours';

  update public.shops
    set subscription_status = 'expired'
    where subscription_status = 'active'
      and subscription_expires_at < now();
end;
$$;
