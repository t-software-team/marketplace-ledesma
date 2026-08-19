-- create_manual_appointment no validaba solapamiento con otros turnos (a
-- diferencia de request_appointment), permitiendo pisar silenciosamente un
-- turno ya confirmado/pending/bloqueado en el mismo horario.
CREATE OR REPLACE FUNCTION "public"."create_manual_appointment"(
  "p_shop_id" uuid,
  "p_starts_at" timestamptz,
  "p_customer_name" text,
  "p_customer_phone" text DEFAULT NULL,
  "p_customer_email" text DEFAULT NULL
) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_duration_minutes int;
  v_ends_at timestamptz;
  v_appointment_id uuid;
begin
  if not exists (select 1 from public.shops where id = p_shop_id and owner_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;

  select slot_duration_minutes into v_duration_minutes
  from public.shop_booking_settings
  where shop_id = p_shop_id;

  if v_duration_minutes is null then
    raise exception 'Configurá primero la duración de turno para este comercio';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration_minutes);

  if exists (
    select 1 from public.appointments
    where shop_id = p_shop_id
      and starts_at = p_starts_at
      and (
        status in ('confirmed', 'blocked', 'completed')
        or (status = 'pending' and hold_expires_at > now())
      )
  ) then
    raise exception 'Ya hay un turno en ese horario';
  end if;

  insert into public.appointments (
    shop_id, starts_at, ends_at, status, origin,
    customer_name, customer_phone, customer_email
  ) values (
    p_shop_id, p_starts_at, v_ends_at, 'confirmed', 'manual',
    nullif(btrim(p_customer_name), ''), nullif(btrim(p_customer_phone), ''), nullif(btrim(p_customer_email), '')
  ) returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;
