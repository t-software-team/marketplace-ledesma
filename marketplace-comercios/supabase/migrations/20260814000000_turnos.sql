-- Módulo de Turnos (Fase 1): agenda de citas para comercios de rubro
-- "servicio". Tablas aditivas + RPCs SECURITY DEFINER (mismo patrón que
-- suspend_shop / notify_shop_owner_*). No se toca esquema existente.

CREATE TYPE "public"."appointment_status" AS ENUM (
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
  'no_show',
  'blocked'
);

CREATE TYPE "public"."appointment_origin" AS ENUM (
  'online',
  'manual'
);

-- Configuración de disponibilidad (1:1 por comercio). weekly_hours guarda,
-- por día de semana (0=domingo..6=sábado), los rangos horarios abiertos,
-- ej: {"1": [{"open":"09:00","close":"13:00"}], "2": [...]}.
CREATE TABLE "public"."shop_booking_settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "shop_id" uuid NOT NULL UNIQUE REFERENCES "public"."shops"("id") ON DELETE CASCADE,
    "slot_duration_minutes" integer NOT NULL DEFAULT 30,
    "weekly_hours" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "is_enabled" boolean NOT NULL DEFAULT false,
    "timezone" text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."shop_booking_settings" OWNER TO "postgres";

CREATE TABLE "public"."appointments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "shop_id" uuid NOT NULL REFERENCES "public"."shops"("id") ON DELETE CASCADE,
    "starts_at" timestamptz NOT NULL,
    "ends_at" timestamptz NOT NULL,
    "status" "public"."appointment_status" NOT NULL DEFAULT 'pending',
    "origin" "public"."appointment_origin" NOT NULL DEFAULT 'online',
    "hold_expires_at" timestamptz,
    "customer_name" text,
    "customer_phone" text,
    "customer_email" text,
    "reminder_sent_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."appointments" OWNER TO "postgres";

CREATE INDEX "appointments_shop_id_starts_at_idx" ON "public"."appointments" ("shop_id", "starts_at");
CREATE INDEX "appointments_shop_id_status_idx" ON "public"."appointments" ("shop_id", "status");
CREATE INDEX "appointments_customer_phone_idx" ON "public"."appointments" ("shop_id", "customer_phone");

-- Guarda dura contra doble-reserva: solo para slots ya comprometidos
-- (confirmado o bloqueado). Los "pending" se resuelven en la RPC porque un
-- índice no puede referenciar now() (hold_expires_at) para excluir vencidos.
CREATE UNIQUE INDEX "appointments_shop_id_starts_at_committed_key"
  ON "public"."appointments" ("shop_id", "starts_at")
  WHERE ("status" IN ('confirmed', 'blocked'));

ALTER TABLE "public"."shop_booking_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;

-- shop_booking_settings: el dueño lee/edita su propia config. Lectura pública
-- (anon/authenticated) también permitida porque get_available_slots corre
-- como función pero el formulario admin necesita leer directo la fila.
CREATE POLICY "shop_booking_settings_owner_select"
  ON "public"."shop_booking_settings" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = shop_booking_settings.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "shop_booking_settings_owner_update"
  ON "public"."shop_booking_settings" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = shop_booking_settings.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "shop_booking_settings_owner_insert"
  ON "public"."shop_booking_settings" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = shop_booking_settings.shop_id AND s.owner_id = auth.uid()
  ));

-- appointments: SIN policy de SELECT/INSERT para anon — todo acceso pasa por
-- RPCs SECURITY DEFINER (evita exponer PII de clientes al público). El dueño
-- puede leer/actualizar sus propias filas directamente (además de vía RPC).
CREATE POLICY "appointments_owner_select"
  ON "public"."appointments" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = appointments.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "appointments_owner_update"
  ON "public"."appointments" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = appointments.shop_id AND s.owner_id = auth.uid()
  ));

-- Trigger genérico de updated_at (reutiliza la función moddatetime si existe;
-- si no, se define localmente para no depender de extensiones).
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE TRIGGER "trg_appointments_set_updated_at"
  BEFORE UPDATE ON "public"."appointments"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE TRIGGER "trg_shop_booking_settings_set_updated_at"
  BEFORE UPDATE ON "public"."shop_booking_settings"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Reserva anónima. Valida que el slot esté libre (sin comprometido, sin hold
-- vigente), aplica rate-limit (máx 2 pending vigentes por teléfono+comercio),
-- fija hold_expires_at = now() + 3h y notifica al dueño.
CREATE OR REPLACE FUNCTION "public"."request_appointment"(
  "p_shop_id" uuid,
  "p_starts_at" timestamptz,
  "p_customer_name" text,
  "p_customer_phone" text,
  "p_customer_email" text DEFAULT NULL
) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_duration_minutes int;
  v_ends_at timestamptz;
  v_owner_id uuid;
  v_live_pending_count int;
  v_appointment_id uuid;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'El nombre es obligatorio';
  end if;

  if p_customer_phone is null or btrim(p_customer_phone) = '' then
    raise exception 'El teléfono es obligatorio';
  end if;

  select slot_duration_minutes, owner_id into v_duration_minutes, v_owner_id
  from public.shop_booking_settings
  join public.shops on shops.id = shop_booking_settings.shop_id
  where shop_booking_settings.shop_id = p_shop_id
    and shop_booking_settings.is_enabled = true;

  if v_duration_minutes is null then
    raise exception 'Este comercio no tiene turnos habilitados';
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
    raise exception 'Ese horario ya no está disponible';
  end if;

  select count(*) into v_live_pending_count
  from public.appointments
  where shop_id = p_shop_id
    and customer_phone = p_customer_phone
    and status = 'pending'
    and hold_expires_at > now();

  if v_live_pending_count >= 2 then
    raise exception 'Ya tenés solicitudes de turno pendientes en este comercio';
  end if;

  insert into public.appointments (
    shop_id, starts_at, ends_at, status, origin, hold_expires_at,
    customer_name, customer_phone, customer_email
  ) values (
    p_shop_id, p_starts_at, v_ends_at, 'pending', 'online', now() + interval '3 hours',
    btrim(p_customer_name), btrim(p_customer_phone), nullif(btrim(p_customer_email), '')
  ) returning id into v_appointment_id;

  if v_owner_id is not null then
    insert into public.client_notifications (client_id, type, reference_id)
    values (v_owner_id, 'new_turno_request', v_appointment_id);
  end if;

  return v_appointment_id;
end;
$$;

ALTER FUNCTION "public"."request_appointment"(uuid, timestamptz, text, text, text) OWNER TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."request_appointment"(uuid, timestamptz, text, text, text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."request_appointment"(uuid, timestamptz, text, text, text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."request_appointment"(uuid, timestamptz, text, text, text) TO "service_role";

-- Helper interno: valida que auth.uid() sea dueño del comercio del turno.
CREATE OR REPLACE FUNCTION "public"."assert_owns_appointment"("p_appointment_id" uuid) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_shop_id uuid;
begin
  select a.shop_id into v_shop_id
  from public.appointments a
  join public.shops s on s.id = a.shop_id
  where a.id = p_appointment_id and s.owner_id = auth.uid();

  if v_shop_id is null then
    raise exception 'No autorizado';
  end if;

  return v_shop_id;
end;
$$;

ALTER FUNCTION "public"."assert_owns_appointment"(uuid) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."confirm_appointment"("p_appointment_id" uuid) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_owns_appointment(p_appointment_id);

  update public.appointments
  set status = 'confirmed', hold_expires_at = null
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."confirm_appointment"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."confirm_appointment"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."confirm_appointment"(uuid) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."reject_appointment"("p_appointment_id" uuid) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_owns_appointment(p_appointment_id);

  update public.appointments
  set status = 'cancelled', hold_expires_at = null
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."reject_appointment"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."reject_appointment"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."reject_appointment"(uuid) TO "service_role";

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

ALTER FUNCTION "public"."create_manual_appointment"(uuid, timestamptz, text, text, text) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."create_manual_appointment"(uuid, timestamptz, text, text, text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."create_manual_appointment"(uuid, timestamptz, text, text, text) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."block_slot"(
  "p_shop_id" uuid,
  "p_starts_at" timestamptz,
  "p_ends_at" timestamptz
) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_appointment_id uuid;
begin
  if not exists (select 1 from public.shops where id = p_shop_id and owner_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;

  insert into public.appointments (shop_id, starts_at, ends_at, status, origin)
  values (p_shop_id, p_starts_at, p_ends_at, 'blocked', 'manual')
  returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;

ALTER FUNCTION "public"."block_slot"(uuid, timestamptz, timestamptz) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."block_slot"(uuid, timestamptz, timestamptz) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."block_slot"(uuid, timestamptz, timestamptz) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."reschedule_appointment"(
  "p_appointment_id" uuid,
  "p_new_starts_at" timestamptz
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_shop_id uuid;
  v_duration_minutes int;
  v_new_ends_at timestamptz;
begin
  v_shop_id := public.assert_owns_appointment(p_appointment_id);

  select slot_duration_minutes into v_duration_minutes
  from public.shop_booking_settings
  where shop_id = v_shop_id;

  if v_duration_minutes is null then
    raise exception 'Configuración de turnos no encontrada';
  end if;

  v_new_ends_at := p_new_starts_at + make_interval(mins => v_duration_minutes);

  if exists (
    select 1 from public.appointments
    where shop_id = v_shop_id
      and id <> p_appointment_id
      and starts_at = p_new_starts_at
      and (
        status in ('confirmed', 'blocked', 'completed')
        or (status = 'pending' and hold_expires_at > now())
      )
  ) then
    raise exception 'Ese horario ya no está disponible';
  end if;

  update public.appointments
  set starts_at = p_new_starts_at, ends_at = v_new_ends_at
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."reschedule_appointment"(uuid, timestamptz) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."reschedule_appointment"(uuid, timestamptz) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."reschedule_appointment"(uuid, timestamptz) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."cancel_appointment"("p_appointment_id" uuid) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_owns_appointment(p_appointment_id);

  update public.appointments
  set status = 'cancelled', hold_expires_at = null
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."cancel_appointment"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."cancel_appointment"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."cancel_appointment"(uuid) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."complete_appointment"("p_appointment_id" uuid) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_owns_appointment(p_appointment_id);

  update public.appointments
  set status = 'completed'
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."complete_appointment"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."complete_appointment"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."complete_appointment"(uuid) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."mark_no_show"("p_appointment_id" uuid) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.assert_owns_appointment(p_appointment_id);

  update public.appointments
  set status = 'no_show'
  where id = p_appointment_id;
end;
$$;

ALTER FUNCTION "public"."mark_no_show"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."mark_no_show"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."mark_no_show"(uuid) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."set_booking_settings"(
  "p_shop_id" uuid,
  "p_slot_duration_minutes" int,
  "p_weekly_hours" jsonb,
  "p_is_enabled" boolean
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.shops where id = p_shop_id and owner_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;

  insert into public.shop_booking_settings (shop_id, slot_duration_minutes, weekly_hours, is_enabled)
  values (p_shop_id, p_slot_duration_minutes, p_weekly_hours, p_is_enabled)
  on conflict (shop_id) do update
  set slot_duration_minutes = excluded.slot_duration_minutes,
      weekly_hours = excluded.weekly_hours,
      is_enabled = excluded.is_enabled,
      updated_at = now();
end;
$$;

ALTER FUNCTION "public"."set_booking_settings"(uuid, int, jsonb, boolean) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."set_booking_settings"(uuid, int, jsonb, boolean) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."set_booking_settings"(uuid, int, jsonb, boolean) TO "service_role";

-- Slots públicos disponibles para una fecha dada. Solo horarios, sin PII.
CREATE OR REPLACE FUNCTION "public"."get_available_slots"(
  "p_shop_id" uuid,
  "p_date" date
) RETURNS TABLE ("starts_at" timestamptz, "ends_at" timestamptz)
    LANGUAGE "plpgsql" SECURITY DEFINER STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_duration_minutes int;
  v_weekly_hours jsonb;
  v_timezone text;
  v_is_enabled boolean;
  v_weekday int;
  v_ranges jsonb;
  v_range jsonb;
  v_day_start timestamptz;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_range_open time;
  v_range_close time;
begin
  select slot_duration_minutes, weekly_hours, timezone, is_enabled
  into v_duration_minutes, v_weekly_hours, v_timezone, v_is_enabled
  from public.shop_booking_settings
  where shop_id = p_shop_id;

  if v_duration_minutes is null or v_is_enabled is distinct from true then
    return;
  end if;

  v_weekday := extract(dow from p_date);
  v_ranges := coalesce(v_weekly_hours -> v_weekday::text, '[]'::jsonb);
  v_day_start := p_date::timestamptz;

  for v_range in select * from jsonb_array_elements(v_ranges)
  loop
    v_range_open := (v_range ->> 'open')::time;
    v_range_close := (v_range ->> 'close')::time;

    v_slot_start := (p_date || ' ' || v_range_open)::timestamp AT TIME ZONE v_timezone;
    v_slot_end := v_slot_start + make_interval(mins => v_duration_minutes);

    while v_slot_end <= ((p_date || ' ' || v_range_close)::timestamp AT TIME ZONE v_timezone) loop
      if not exists (
        select 1 from public.appointments a
        where a.shop_id = p_shop_id
          and a.starts_at = v_slot_start
          and (
            a.status in ('confirmed', 'blocked', 'completed')
            or (a.status = 'pending' and a.hold_expires_at > now())
          )
      ) then
        starts_at := v_slot_start;
        ends_at := v_slot_end;
        return next;
      end if;

      v_slot_start := v_slot_end;
      v_slot_end := v_slot_start + make_interval(mins => v_duration_minutes);
    end loop;
  end loop;
end;
$$;

ALTER FUNCTION "public"."get_available_slots"(uuid, date) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_available_slots"(uuid, date) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_available_slots"(uuid, date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_available_slots"(uuid, date) TO "service_role";

-- Recordatorios: turnos confirmados que arrancan entre 20h y 28h desde ahora
-- (ventana amplia porque el cron corre 1 vez por día) y aún no recordados.
-- service_role only: el cron route usa el service-role client.
CREATE OR REPLACE FUNCTION "public"."enqueue_appointment_reminders"()
RETURNS TABLE (
  "id" uuid,
  "shop_id" uuid,
  "shop_name" text,
  "starts_at" timestamptz,
  "customer_email" text
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  update public.appointments a
  set reminder_sent_at = now()
  from public.shops s
  where a.shop_id = s.id
    and a.status = 'confirmed'
    and a.customer_email is not null
    and a.reminder_sent_at is null
    and a.starts_at between now() + interval '20 hours' and now() + interval '28 hours'
  returning a.id, a.shop_id, s.name, a.starts_at, a.customer_email;
end;
$$;

ALTER FUNCTION "public"."enqueue_appointment_reminders"() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."enqueue_appointment_reminders"() TO "service_role";
