-- PR5 (veterinaria): vincular turnos a un paciente opcional, y permitir
-- crear turnos manuales con paciente asociado.

alter table public.appointments
  add column if not exists patient_id uuid references public.patients(id) on delete set null;

create index if not exists idx_appointments_patient_id
  on public.appointments (patient_id);

-- create_manual_appointment: agrega p_patient_id opcional al final de la
-- firma (default null). Postgres identifica funciones por firma completa,
-- así que CREATE OR REPLACE con un parámetro nuevo NO reemplaza la versión
-- de 5 parámetros — crea un overload aparte y deja la vieja huérfana. Hay
-- que borrarla explícitamente antes de recrear la función.
DROP FUNCTION IF EXISTS "public"."create_manual_appointment"(uuid, timestamptz, text, text, text);

CREATE OR REPLACE FUNCTION "public"."create_manual_appointment"(
  "p_shop_id" uuid,
  "p_starts_at" timestamptz,
  "p_customer_name" text,
  "p_customer_phone" text DEFAULT NULL,
  "p_customer_email" text DEFAULT NULL,
  "p_patient_id" uuid DEFAULT NULL
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

  if p_patient_id is not null and not exists (
    select 1 from public.patients where id = p_patient_id and shop_id = p_shop_id
  ) then
    raise exception 'El paciente no pertenece a este comercio';
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
    customer_name, customer_phone, customer_email, patient_id
  ) values (
    p_shop_id, p_starts_at, v_ends_at, 'confirmed', 'manual',
    nullif(btrim(p_customer_name), ''), nullif(btrim(p_customer_phone), ''), nullif(btrim(p_customer_email), ''),
    p_patient_id
  ) returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;

GRANT EXECUTE ON FUNCTION "public"."create_manual_appointment"(uuid, timestamptz, text, text, text, uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."create_manual_appointment"(uuid, timestamptz, text, text, text, uuid) TO "service_role";
