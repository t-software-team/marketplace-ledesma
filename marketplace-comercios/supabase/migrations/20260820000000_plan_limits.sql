-- Centraliza los límites del plan gratuito/pago (hoy hardcodeados en
-- src/lib/shops/queries.ts) en una tabla editable por el superadmin desde el
-- panel de admin. Necesario porque la futura app mobile (React Native)
-- también va a necesitar leer estos límites, y hoy no tiene forma de hacerlo
-- salvo duplicando las constantes en TypeScript.

-- max_products_service / max_products_product son NULL para el plan "paid"
-- porque hoy el límite de un comercio pago sale de subscription_plans.benefits
-- (max_products); esta tabla solo aporta el fallback cuando el plan no lo
-- especifica, y ese fallback histórico es "sin límite" (NULL), no un número
-- fijo. El plan "free" siempre usa un número concreto.
CREATE TABLE IF NOT EXISTS "public"."plan_limits" (
    "plan" "text" NOT NULL,
    "max_products_service" integer,
    "max_products_product" integer,
    "max_images" integer NOT NULL,
    "max_variants" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("plan"),
    CONSTRAINT "plan_limits_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'paid'::"text"]))),
    CONSTRAINT "plan_limits_max_products_service_check" CHECK (("max_products_service" IS NULL OR "max_products_service" >= 0)),
    CONSTRAINT "plan_limits_max_products_product_check" CHECK (("max_products_product" IS NULL OR "max_products_product" >= 0)),
    CONSTRAINT "plan_limits_max_images_check" CHECK (("max_images" >= 0)),
    CONSTRAINT "plan_limits_max_variants_check" CHECK (("max_variants" >= 0))
);

ALTER TABLE "public"."plan_limits" OWNER TO "postgres";

ALTER TABLE "public"."plan_limits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_limits_select_public" ON "public"."plan_limits" FOR SELECT USING (true);

CREATE POLICY "plan_limits_write_superadmin" ON "public"."plan_limits" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());

GRANT ALL ON TABLE "public"."plan_limits" TO "anon";
GRANT ALL ON TABLE "public"."plan_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_limits" TO "service_role";

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

CREATE TRIGGER "plan_limits_set_updated_at"
    BEFORE UPDATE ON "public"."plan_limits"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

-- Semilla con los valores hoy hardcodeados en src/lib/shops/queries.ts
INSERT INTO "public"."plan_limits" ("plan", "max_products_service", "max_products_product", "max_images", "max_variants")
VALUES
    ('free', 3, 15, 2, 3),
    ('paid', NULL, NULL, 5, 10)
ON CONFLICT ("plan") DO NOTHING;
