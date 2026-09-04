-- RLS: appointments ya tiene ENABLE ROW LEVEL SECURITY + policies
-- (appointments_owner_select/appointments_owner_update, ver
-- 20260814000000_turnos.sql). Son a nivel de fila, no de columna, así que
-- cubren amount_charged sin necesidad de una policy nueva.
ALTER TABLE "public"."appointments"
  ADD COLUMN "amount_charged" numeric(10, 2);

COMMENT ON COLUMN "public"."appointments"."amount_charged" IS
  'Monto cobrado al completar el turno. Se carga a mano (no hay lista de precios), puede quedar null si no se registró.';

DROP FUNCTION IF EXISTS "public"."complete_appointment"(uuid);

CREATE OR REPLACE FUNCTION "public"."complete_appointment"(
  "p_appointment_id" uuid,
  "p_amount_charged" numeric DEFAULT NULL
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_owns_appointment(p_appointment_id);

  update public.appointments
  set status = 'completed',
      amount_charged = p_amount_charged
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."complete_appointment"(uuid, numeric) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."complete_appointment"(uuid, numeric) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."complete_appointment"(uuid, numeric) TO "service_role";
