-- Permite guardar un color libre (hex) en shops.accent_color además de las
-- presets fijas, para el picker de color libre de /mi-tienda/personalizar.
ALTER TABLE "public"."shops"
  DROP CONSTRAINT "shops_accent_color_check";

ALTER TABLE "public"."shops"
  ADD CONSTRAINT "shops_accent_color_check" CHECK (
    ("accent_color" IS NULL)
    OR ("accent_color" = ANY (ARRAY['violet'::"text", 'rose'::"text", 'orange'::"text", 'amber'::"text", 'emerald'::"text", 'sky'::"text", 'pink'::"text"]))
    OR ("accent_color" ~ '^#[0-9a-fA-F]{6}$'::"text")
  );
