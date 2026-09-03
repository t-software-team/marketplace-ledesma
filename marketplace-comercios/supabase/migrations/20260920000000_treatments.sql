-- Módulo de Tratamientos (Fase 2 de "Veterinaria"): catálogo de plantillas de
-- tratamiento por comercio + aplicaciones a pacientes. Tablas aditivas + RLS
-- `_owner_*` policies, mismo patrón que patients (20260919000000_patients.sql)
-- y turnos (20260814000000_turnos.sql). No se toca esquema existente.

CREATE TYPE "public"."treatment_type" AS ENUM ('vacuna', 'desparasitacion');

CREATE TABLE "public"."treatment_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "shop_id" uuid NOT NULL REFERENCES "public"."shops"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "type" "public"."treatment_type" NOT NULL,
    "recommended_age_days" integer,
    "requires_booster" boolean NOT NULL DEFAULT false,
    "booster_interval_days" integer,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."treatment_templates" OWNER TO "postgres";

CREATE INDEX "treatment_templates_shop_id_idx" ON "public"."treatment_templates" ("shop_id");

ALTER TABLE "public"."treatment_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatment_templates_owner_select"
  ON "public"."treatment_templates" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = treatment_templates.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_templates_owner_insert"
  ON "public"."treatment_templates" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = treatment_templates.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_templates_owner_update"
  ON "public"."treatment_templates" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = treatment_templates.shop_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_templates_owner_delete"
  ON "public"."treatment_templates" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."shops" s
    WHERE s.id = treatment_templates.shop_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER "trg_treatment_templates_set_updated_at"
  BEFORE UPDATE ON "public"."treatment_templates"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Aplicaciones de tratamiento a un paciente. next_due_at se calcula al
-- momento de la aplicación (applied_at + booster_interval_days del template,
-- si requires_booster; si no, null) y queda ALMACENADO — a diferencia del
-- status (al_dia/proximo/vencido), que se deriva en TypeScript a partir de
-- este valor y NUNCA se persiste (no-goal explícito). reminder_sent_at queda
-- previsto (nullable) para el cron de recordatorios de PR4, que reutilizará
-- esta misma tabla sin necesitar otra migración de ALTER.
CREATE TABLE "public"."treatment_applications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "patient_id" uuid NOT NULL REFERENCES "public"."patients"("id") ON DELETE CASCADE,
    "template_id" uuid REFERENCES "public"."treatment_templates"("id") ON DELETE SET NULL,
    "applied_at" timestamptz NOT NULL DEFAULT now(),
    "next_due_at" timestamptz,
    "reminder_sent_at" timestamptz,
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."treatment_applications" OWNER TO "postgres";

CREATE INDEX "treatment_applications_patient_id_idx" ON "public"."treatment_applications" ("patient_id");
CREATE INDEX "treatment_applications_next_due_at_idx" ON "public"."treatment_applications" ("next_due_at");

ALTER TABLE "public"."treatment_applications" ENABLE ROW LEVEL SECURITY;

-- El dueño de una aplicación es el dueño del comercio del paciente asociado
-- (join anidado patients -> shops), igual que las RPCs que ya usan
-- assert_owns_patient.
CREATE POLICY "treatment_applications_owner_select"
  ON "public"."treatment_applications" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = treatment_applications.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_applications_owner_insert"
  ON "public"."treatment_applications" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = treatment_applications.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_applications_owner_update"
  ON "public"."treatment_applications" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = treatment_applications.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_applications_owner_delete"
  ON "public"."treatment_applications" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = treatment_applications.patient_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER "trg_treatment_applications_set_updated_at"
  BEFORE UPDATE ON "public"."treatment_applications"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Helpers internos: validan que auth.uid() sea dueño del comercio dueño de la
-- plantilla / de la aplicación. Clones de assert_owns_patient.
CREATE OR REPLACE FUNCTION "public"."assert_owns_treatment_template"("p_template_id" uuid) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_shop_id uuid;
begin
  select t.shop_id into v_shop_id
  from public.treatment_templates t
  join public.shops s on s.id = t.shop_id
  where t.id = p_template_id and s.owner_id = auth.uid();

  if v_shop_id is null then
    raise exception 'No autorizado';
  end if;

  return v_shop_id;
end;
$$;

ALTER FUNCTION "public"."assert_owns_treatment_template"(uuid) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."assert_owns_treatment_application"("p_application_id" uuid) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_shop_id uuid;
begin
  select s.id into v_shop_id
  from public.treatment_applications a
  join public.patients p on p.id = a.patient_id
  join public.shops s on s.id = p.shop_id
  where a.id = p_application_id and s.owner_id = auth.uid();

  if v_shop_id is null then
    raise exception 'No autorizado';
  end if;

  return v_shop_id;
end;
$$;

ALTER FUNCTION "public"."assert_owns_treatment_application"(uuid) OWNER TO "postgres";
