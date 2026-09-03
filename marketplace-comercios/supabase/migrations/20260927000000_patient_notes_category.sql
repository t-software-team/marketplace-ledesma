-- Historial clínico (ciclo 3, PR A): categoría fija por nota + backfill de
-- las notas legadas en `patients.notes` hacia `patient_notes`. text+CHECK en
-- vez de enum de Postgres, mismo criterio que el resto del proyecto (nunca
-- se usan enums nativos; ver `treatment_templates.type`).

ALTER TABLE "public"."patient_notes"
  ADD COLUMN "category" text NOT NULL DEFAULT 'otro';

ALTER TABLE "public"."patient_notes"
  ADD CONSTRAINT "patient_notes_category_check"
  CHECK ("category" IN ('consulta', 'cirugia', 'analisis', 'vacunacion', 'otro'));

-- Backfill: cada paciente con `patients.notes` no vacío pasa a tener una fila
-- en `patient_notes` con ese contenido, categoría 'otro'. La columna
-- `patients.notes` NO se borra en este ciclo (drop diferido a un follow-up).
INSERT INTO "public"."patient_notes" ("patient_id", "content", "category")
SELECT "id", "notes", 'otro'
FROM "public"."patients"
WHERE "notes" IS NOT NULL AND btrim("notes") <> '';
