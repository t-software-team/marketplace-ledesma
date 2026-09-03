-- Módulo de Recordatorios genéricos (PR5a de "Veterinaria" ciclo 2):
-- recordatorios libres por paciente, independientes de treatment_applications
-- (D1 del design: NO se generaliza treatment_applications). Tabla aditiva +
-- RLS `_owner_*` policies, mismo patrón exacto que patients
-- (20260919000000_patients.sql) y treatment_applications
-- (20260920000000_treatments.sql). No se toca esquema existente.

CREATE TABLE "public"."patient_reminders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "patient_id" uuid NOT NULL REFERENCES "public"."patients"("id") ON DELETE CASCADE,
    "label" text NOT NULL,
    "due_at" timestamptz NOT NULL,
    "reminder_sent_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."patient_reminders" OWNER TO "postgres";

CREATE INDEX "patient_reminders_patient_id_idx" ON "public"."patient_reminders" ("patient_id");
CREATE INDEX "patient_reminders_due_at_idx" ON "public"."patient_reminders" ("due_at");

ALTER TABLE "public"."patient_reminders" ENABLE ROW LEVEL SECURITY;

-- El dueño de un recordatorio es el dueño del comercio del paciente asociado
-- (join anidado patients -> shops), igual que treatment_applications.
CREATE POLICY "patient_reminders_owner_select"
  ON "public"."patient_reminders" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_reminders.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_reminders_owner_insert"
  ON "public"."patient_reminders" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_reminders.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_reminders_owner_update"
  ON "public"."patient_reminders" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_reminders.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_reminders_owner_delete"
  ON "public"."patient_reminders" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_reminders.patient_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER "trg_patient_reminders_set_updated_at"
  BEFORE UPDATE ON "public"."patient_reminders"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Helper interno: valida que auth.uid() sea dueño del comercio del
-- recordatorio. Clon de assert_owns_treatment_application.
CREATE OR REPLACE FUNCTION "public"."assert_owns_patient_reminder"("p_reminder_id" uuid) RETURNS uuid
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_shop_id uuid;
begin
  select s.id into v_shop_id
  from public.patient_reminders r
  join public.patients p on p.id = r.patient_id
  join public.shops s on s.id = p.shop_id
  where r.id = p_reminder_id and s.owner_id = auth.uid();

  if v_shop_id is null then
    raise exception 'No autorizado';
  end if;

  return v_shop_id;
end;
$$;

ALTER FUNCTION "public"."assert_owns_patient_reminder"(uuid) OWNER TO "postgres";
