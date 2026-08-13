-- Permite borrar notificaciones ya leídas (nunca no leídas) desde el
-- dropdown de NotificationBell y las páginas /notificaciones. Sigue el mismo
-- patrón que las policies de select/update de client_notifications y las RPC
-- SECURITY DEFINER de admin_notifications (mark_admin_notification_read /
-- mark_all_admin_notifications_read).

CREATE POLICY "client_notifications_delete_own" ON "public"."client_notifications" FOR DELETE TO "authenticated" USING (("client_id" = "auth"."uid"()));


-- RPC para borrar una notificación de admin individual. admin_notifications
-- no tiene policy de DELETE por fila (solo SELECT), así que esta función
-- SECURITY DEFINER es necesaria, igual que mark_admin_notification_read.
CREATE OR REPLACE FUNCTION "public"."delete_admin_notification"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  delete from public.admin_notifications
  where id = p_id;
end;
$$;


ALTER FUNCTION "public"."delete_admin_notification"("p_id" "uuid") OWNER TO "postgres";


GRANT ALL ON FUNCTION "public"."delete_admin_notification"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_admin_notification"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_admin_notification"("p_id" "uuid") TO "service_role";


-- RPC para borrar en bloque todas las notificaciones de admin ya leídas.
CREATE OR REPLACE FUNCTION "public"."delete_read_admin_notifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  delete from public.admin_notifications
  where is_read = true;
end;
$$;


ALTER FUNCTION "public"."delete_read_admin_notifications"() OWNER TO "postgres";


GRANT ALL ON FUNCTION "public"."delete_read_admin_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_read_admin_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_read_admin_notifications"() TO "service_role";
