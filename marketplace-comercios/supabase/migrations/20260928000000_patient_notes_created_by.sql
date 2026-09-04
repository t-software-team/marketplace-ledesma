-- PR B: atribución de autor en notas de historial clínico.
-- Nullable porque las notas existentes (creadas antes de esta migración, o
-- backfilleadas desde patients.notes en la migración anterior) no tienen
-- autor conocido. Sin nuevas políticas RLS: patient_notes ya tiene SELECT/
-- UPDATE/DELETE owner-based por comercio (dueño del paciente), no por autor
-- individual de la nota.
ALTER TABLE patient_notes
  ADD COLUMN created_by uuid NULL REFERENCES auth.users (id);
