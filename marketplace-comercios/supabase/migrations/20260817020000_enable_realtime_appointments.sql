-- Habilita postgres_changes (Supabase Realtime) sobre appointments para que
-- el panel de turnos del comerciante se actualice solo cuando un cliente
-- reserva desde la tienda pública, sin recargar la página.
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."appointments";
