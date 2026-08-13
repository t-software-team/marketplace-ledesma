-- Notificaciones para dueños de comercio: nuevas reseñas, nuevos contactos,
-- resultado de verificación y estado de suscripción. Sigue el mismo patrón
-- que las funciones notify_admin_* / notify_shop_followers_new_product ya
-- existentes, insertando en client_notifications con client_id = owner_id.

CREATE OR REPLACE FUNCTION "public"."notify_shop_owner_new_review"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.shops where id = new.shop_id;

  if v_owner_id is not null then
    insert into public.client_notifications (client_id, type, reference_id)
    values (v_owner_id, 'new_review', new.id);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_shop_owner_new_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_shop_owner_new_contact"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.shops where id = new.shop_id;

  if v_owner_id is not null then
    insert into public.client_notifications (client_id, type, reference_id)
    values (v_owner_id, 'new_contact', new.id);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_shop_owner_new_contact"() OWNER TO "postgres";


-- Nota: el enum verification_status usa 'verified' (no 'approved'), pero el
-- tipo de notificación se llama 'verification_approved' para que quede claro
-- del lado del cliente qué significa el cambio de estado.
CREATE OR REPLACE FUNCTION "public"."notify_shop_owner_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.verification_status = 'verified'
     and old.verification_status is distinct from 'verified' then
    insert into public.client_notifications (client_id, type, reference_id)
    values (new.owner_id, 'verification_approved', new.id);
  elsif new.verification_status = 'rejected'
     and old.verification_status is distinct from 'rejected' then
    insert into public.client_notifications (client_id, type, reference_id)
    values (new.owner_id, 'verification_rejected', new.id);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_shop_owner_verification"() OWNER TO "postgres";


CREATE TRIGGER "trg_notify_shop_owner_new_review" AFTER INSERT ON "public"."shop_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."notify_shop_owner_new_review"();


CREATE TRIGGER "trg_notify_shop_owner_new_contact" AFTER INSERT ON "public"."shop_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."notify_shop_owner_new_contact"();


CREATE TRIGGER "trg_notify_shop_owner_verification" AFTER UPDATE ON "public"."shops" FOR EACH ROW EXECUTE FUNCTION "public"."notify_shop_owner_verification"();


GRANT ALL ON FUNCTION "public"."notify_shop_owner_new_review"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_shop_owner_new_review"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_shop_owner_new_review"() TO "service_role";

GRANT ALL ON FUNCTION "public"."notify_shop_owner_new_contact"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_shop_owner_new_contact"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_shop_owner_new_contact"() TO "service_role";

GRANT ALL ON FUNCTION "public"."notify_shop_owner_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_shop_owner_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_shop_owner_verification"() TO "service_role";


-- Extiende expire_subscriptions() (invocada por el cron diario existente en
-- /api/cron/expire-subscriptions) para además avisarle al dueño del comercio
-- cuando su suscripción está por vencer o cuando venció. Se preserva la
-- lógica de limpieza de "pending" abandonadas agregada en
-- 20260812010000_expire_stale_pending_subscriptions.sql.
CREATE OR REPLACE FUNCTION "public"."expire_subscriptions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.client_notifications (client_id, type, reference_id)
  select sh.owner_id, 'subscription_expiring_soon', s.id
  from public.subscriptions s
  join public.shops sh on sh.id = s.shop_id
  where s.status = 'active'
    and s.end_date is not null
    and s.end_date between now() and now() + interval '3 days'
    and not exists (
      select 1 from public.client_notifications cn
      where cn.type = 'subscription_expiring_soon'
        and cn.reference_id = s.id
        and cn.created_at > now() - interval '3 days'
    );

  insert into public.client_notifications (client_id, type, reference_id)
  select sh.owner_id, 'subscription_expired', s.id
  from public.subscriptions s
  join public.shops sh on sh.id = s.shop_id
  where s.status = 'active' and s.end_date < now();

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


-- RPC para marcar una notificación de admin individual como leída.
-- admin_notifications no tiene policy de UPDATE por fila (solo SELECT), así
-- que esta función SECURITY DEFINER es necesaria para el "mark as read" por
-- ítem, igual que mark_all_admin_notifications_read para "marcar todas".
CREATE OR REPLACE FUNCTION "public"."mark_admin_notification_read"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  update public.admin_notifications
  set is_read = true
  where id = p_id;
end;
$$;


ALTER FUNCTION "public"."mark_admin_notification_read"("p_id" "uuid") OWNER TO "postgres";


GRANT ALL ON FUNCTION "public"."mark_admin_notification_read"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_admin_notification_read"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_admin_notification_read"("p_id" "uuid") TO "service_role";
