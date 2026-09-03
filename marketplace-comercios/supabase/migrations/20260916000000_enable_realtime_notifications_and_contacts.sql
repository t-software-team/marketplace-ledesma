-- Mismo bug que gym_check_ins (20260915000000): estas tres tablas se
-- suscriben vía postgres_changes en el código (NotificationBell con
-- realtimeTable="client_notifications"/"admin_notifications", y
-- LiveContactsFeed sobre shop_contacts) pero nunca se agregaron a la
-- publicación supabase_realtime, que en este proyecto no es FOR ALL TABLES.
-- Sin esto, la campanita de notificaciones y el feed de contactos del admin
-- nunca actualizan solos — hay que recargar la página siempre.
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."client_notifications";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."admin_notifications";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."shop_contacts";
