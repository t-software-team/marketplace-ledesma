-- Rediseño del módulo de Tratamientos ANTES de su primer merge (20260920000000
-- ya está aplicada en remoto, confirmado con `supabase migration list --linked`,
-- por eso esto es una migración ALTER encima y no un reemplazo del archivo
-- anterior). Reemplaza el modelo "requires_booster/booster_interval_days" por
-- una secuencia explícita de dosis por plantilla (treatment_template_doses),
-- permitiendo series con múltiples dosis (ej. 3 dosis de cachorro + refuerzo
-- anual) en vez de un único intervalo fijo.

-- treatment_templates: se agrega species (para filtrar/sugerir por especie) y
-- se sacan los campos que pasan a vivir en treatment_template_doses.
ALTER TABLE "public"."treatment_templates"
  ADD COLUMN "species" text;

ALTER TABLE "public"."treatment_templates"
  DROP COLUMN "recommended_age_days",
  DROP COLUMN "requires_booster",
  DROP COLUMN "booster_interval_days";

-- Secuencia de dosis de una plantilla. dose_number=1 es la primera dosis de la
-- serie (age_weeks tiene sentido acá); dose_number>1 usa
-- interval_days_after_previous (días desde la dosis anterior). Solo la ÚLTIMA
-- dosis de la serie puede ser is_recurring=true (refuerzo periódico
-- indefinido); eso se valida en la capa de aplicación (Zod), no en SQL.
CREATE TABLE "public"."treatment_template_doses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "template_id" uuid NOT NULL REFERENCES "public"."treatment_templates"("id") ON DELETE CASCADE,
    "dose_number" integer NOT NULL,
    "label" text NOT NULL,
    "age_weeks" integer,
    "interval_days_after_previous" integer,
    "is_recurring" boolean NOT NULL DEFAULT false,
    "recurrence_interval_days" integer,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "treatment_template_doses_template_id_dose_number_key" UNIQUE ("template_id", "dose_number")
);

ALTER TABLE "public"."treatment_template_doses" OWNER TO "postgres";

CREATE INDEX "treatment_template_doses_template_id_idx" ON "public"."treatment_template_doses" ("template_id");

ALTER TABLE "public"."treatment_template_doses" ENABLE ROW LEVEL SECURITY;

-- El dueño de una dosis es el dueño del comercio de la plantilla (join
-- template_id -> treatment_templates -> shop_id -> shops.owner_id).
CREATE POLICY "treatment_template_doses_owner_select"
  ON "public"."treatment_template_doses" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."treatment_templates" t
    JOIN "public"."shops" s ON s.id = t.shop_id
    WHERE t.id = treatment_template_doses.template_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_template_doses_owner_insert"
  ON "public"."treatment_template_doses" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."treatment_templates" t
    JOIN "public"."shops" s ON s.id = t.shop_id
    WHERE t.id = treatment_template_doses.template_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_template_doses_owner_update"
  ON "public"."treatment_template_doses" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."treatment_templates" t
    JOIN "public"."shops" s ON s.id = t.shop_id
    WHERE t.id = treatment_template_doses.template_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "treatment_template_doses_owner_delete"
  ON "public"."treatment_template_doses" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."treatment_templates" t
    JOIN "public"."shops" s ON s.id = t.shop_id
    WHERE t.id = treatment_template_doses.template_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER "trg_treatment_template_doses_set_updated_at"
  BEFORE UPDATE ON "public"."treatment_template_doses"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- treatment_applications: referencia a la dosis específica aplicada (nullable
-- por si se borra la dosis de la plantilla después — no debe romper el
-- historial) y trazabilidad de producto/lote aplicado.
ALTER TABLE "public"."treatment_applications"
  ADD COLUMN "template_dose_id" uuid REFERENCES "public"."treatment_template_doses"("id") ON DELETE SET NULL,
  ADD COLUMN "product_name" text;

CREATE INDEX "treatment_applications_template_dose_id_idx" ON "public"."treatment_applications" ("template_dose_id");
