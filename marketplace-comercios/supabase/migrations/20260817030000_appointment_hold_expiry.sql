-- 1) confirm_appointment ya no debe poder confirmar un turno pending cuyo
--    hold venció (el slot ya se liberó y pudo haberlo tomado otro cliente).
CREATE OR REPLACE FUNCTION "public"."confirm_appointment"("p_appointment_id" uuid) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_status public.appointment_status;
  v_hold_expires_at timestamptz;
begin
  perform public.assert_owns_appointment(p_appointment_id);

  select status, hold_expires_at into v_status, v_hold_expires_at
  from public.appointments
  where id = p_appointment_id;

  if v_status <> 'pending' then
    raise exception 'Este turno ya no está pendiente de confirmación';
  end if;

  if v_hold_expires_at is not null and v_hold_expires_at < now() then
    raise exception 'La reserva de este horario venció; el cliente debe solicitarlo de nuevo';
  end if;

  update public.appointments
  set status = 'confirmed', hold_expires_at = null
  where id = p_appointment_id;
end;
$$;

-- 2) Limpieza reactiva: cancela pending con hold vencido de un comercio.
--    Se llama de forma best-effort (con el service-role client, desde
--    getShopAppointments) cada vez que el panel de turnos lee la lista, para
--    que el estado se vea al día sin depender solo del cron diario (Vercel
--    Hobby no permite crons más frecuentes). service_role only: no valida
--    ownership, así que no se expone a "authenticated"/"anon".
CREATE OR REPLACE FUNCTION "public"."expire_pending_holds"("p_shop_id" uuid) RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update public.appointments
  set status = 'cancelled'
  where shop_id = p_shop_id
    and status = 'pending'
    and hold_expires_at is not null
    and hold_expires_at < now();
$$;

ALTER FUNCTION "public"."expire_pending_holds"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."expire_pending_holds"(uuid) TO "service_role";
