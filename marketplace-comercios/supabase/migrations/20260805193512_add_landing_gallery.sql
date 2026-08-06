ALTER TABLE "public"."shops"
  ADD COLUMN IF NOT EXISTS "landing_gallery" "jsonb";
