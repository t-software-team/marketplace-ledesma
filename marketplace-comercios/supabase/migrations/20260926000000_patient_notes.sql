-- Historial clínico (PR7a de "Veterinaria" ciclo 2): notas libres por
-- paciente con adjuntos (fotos/PDFs), patrón parent-child idéntico a
-- treatment_templates/treatment_template_doses (20260921000000). Tabla
-- aditiva + RLS `_owner_*` clonadas de patients/treatment_applications.
-- No se toca esquema existente.

CREATE TABLE "public"."patient_notes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "patient_id" uuid NOT NULL REFERENCES "public"."patients"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."patient_notes" OWNER TO "postgres";

CREATE INDEX "patient_notes_patient_id_idx" ON "public"."patient_notes" ("patient_id");

ALTER TABLE "public"."patient_notes" ENABLE ROW LEVEL SECURITY;

-- El dueño de una nota es el dueño del comercio del paciente asociado (join
-- anidado patients -> shops), igual que patient_reminders.
CREATE POLICY "patient_notes_owner_select"
  ON "public"."patient_notes" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_notes.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_notes_owner_insert"
  ON "public"."patient_notes" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_notes.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_notes_owner_update"
  ON "public"."patient_notes" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_notes.patient_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_notes_owner_delete"
  ON "public"."patient_notes" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."patients" p
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE p.id = patient_notes.patient_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER "trg_patient_notes_set_updated_at"
  BEFORE UPDATE ON "public"."patient_notes"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Adjuntos de una nota (fotos/PDFs subidos a Storage). Metadata por archivo
-- (file_name) en vez de un array de URLs en patient_notes, para poder
-- mostrar el nombre original en la UI del timeline (PR7b) sin parsear la URL.
CREATE TABLE "public"."patient_note_attachments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "note_id" uuid NOT NULL REFERENCES "public"."patient_notes"("id") ON DELETE CASCADE,
    "url" text NOT NULL,
    "file_name" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."patient_note_attachments" OWNER TO "postgres";

CREATE INDEX "patient_note_attachments_note_id_idx" ON "public"."patient_note_attachments" ("note_id");

ALTER TABLE "public"."patient_note_attachments" ENABLE ROW LEVEL SECURITY;

-- El dueño de un adjunto es el dueño del comercio de la nota (join
-- note_id -> patient_notes -> patient_id -> patients -> shop_id -> shops),
-- mismo patrón que treatment_template_doses vía template_id.
CREATE POLICY "patient_note_attachments_owner_select"
  ON "public"."patient_note_attachments" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."patient_notes" n
    JOIN "public"."patients" p ON p.id = n.patient_id
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE n.id = patient_note_attachments.note_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_note_attachments_owner_insert"
  ON "public"."patient_note_attachments" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."patient_notes" n
    JOIN "public"."patients" p ON p.id = n.patient_id
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE n.id = patient_note_attachments.note_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "patient_note_attachments_owner_delete"
  ON "public"."patient_note_attachments" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."patient_notes" n
    JOIN "public"."patients" p ON p.id = n.patient_id
    JOIN "public"."shops" s ON s.id = p.shop_id
    WHERE n.id = patient_note_attachments.note_id AND s.owner_id = auth.uid()
  ));

-- NOTA (runbook, ver docs/PENDIENTES.md): el bucket `patient-documents` +
-- sus policies de Storage se provisionan a mano en el dashboard de Supabase
-- antes de poder subir adjuntos en producción — mismo criterio que
-- `patient-photos` (PR1) y `product-images`. No se crea acá.
