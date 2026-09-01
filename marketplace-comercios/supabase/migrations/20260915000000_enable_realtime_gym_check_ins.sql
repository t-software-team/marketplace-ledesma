-- Habilita postgres_changes (Supabase Realtime) sobre gym_check_ins para que
-- "Actividad de hoy" en /mi-tienda/ingresos se actualice sola cuando alguien
-- registra su entrada desde el autoingreso público (/ingresos/[token]), sin
-- recargar la página. Mismo motivo que 20260817020000_enable_realtime_appointments.
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."gym_check_ins";
