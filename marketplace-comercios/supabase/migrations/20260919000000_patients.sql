-- Módulo de Pacientes (Fase 1 de "Veterinaria"): fichas de pacientes para
-- comercios de rubro "veterinaria". Tabla aditiva + RLS `_owner_*` policies,
-- mismo patrón que el módulo de Turnos (20260814000000_turnos.sql). No se
-- toca esquema existente.

CREATE TABLE "public"."patients" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "shop_id" uuid NOT NULL REFERENCES "public"."shops"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "species" text,
    "breed" text,
    "sex" text,
    "birth_date" date,
    "weight" numeric,
    "notes" text,
    "photo_url" text,
    "owner_name" text,
    "owner_email" text,
    "owner_phone" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."patients" OWNER TO "postgres";

CREATE INDEX "patients_shop_id_idx" ON "public"."patients" ("shop_id");
CREATE INDEX "patients_shop_id_owner_phone_idx" ON "public"."patients" ("shop_id", "owner_phone");
CREATE INDEX "patients_shop_id_owner_email_idx" ON "public"."patients" ("shop_id", "owner_email");

ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;

-- Sin policy de acceso público/anon: los pacientes son datos privados del
-- dueño del comercio, a diferencia de appointments que necesita reservas
-- anónimas vía RPC. Todo el CRUD pasa por el dueño autenticado.
CREATE POLICY "patients_owner_select"
  ON "public"."patients" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = patients.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patients_owner_insert"
  ON "public"."patients" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = patients.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patients_owner_update"
  ON "public"."patients" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = patients.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patients_owner_delete"
  ON "public"."patients" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = patients.shop_id AND s.owner_id = auth.uid()
  ));

-- Reutiliza el trigger genérico set_updated_at() ya definido en
-- 20260814000000_turnos.sql (CREATE OR REPLACE, así que esta migración
-- también funciona si se aplica de forma aislada / en otro orden).
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE TRIGGER "trg_patients_set_updated_at"
  BEFORE UPDATE ON "public"."patients"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Helper interno: valida que auth.uid() sea dueño del comercio del paciente.
-- Clon de assert_owns_appointment; lo usarán las RPCs de tratamientos (PR2).
CREATE OR REPLACE FUNCTION "public"."assert_owns_patient"("p_patient_id" uuid) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_shop_id uuid;
begin
  select p.shop_id into v_shop_id
  from public.patients p
  join public.shops s on s.id = p.shop_id
  where p.id = p_patient_id and s.owner_id = auth.uid();

  if v_shop_id is null then
    raise exception 'No autorizado';
  end if;

  return v_shop_id;
end;
$$;

ALTER FUNCTION "public"."assert_owns_patient"(uuid) OWNER TO "postgres";

-- NOTA (runbook): el bucket de Storage `patient-photos` y sus policies se
-- provisionan a mano en el dashboard de Supabase, NO en esta migración —
-- sigue la misma convención que shop-logos/product-images/avatars/etc.
-- (ningún bucket existente se crea vía SQL en este proyecto). Ver
-- docs/PENDIENTES.md para el detalle de qué falta crear antes de deploy.
