-- Plantillas de tienda: el dueño elige un layout prearmado para su tienda
-- pública (ej. 'shopmore') en lugar de configurar cada sección a mano. Guardamos
-- solo la clave de la plantilla; el contenido (hero, color) reutiliza columnas
-- existentes (landing_banner, accent_color). NULL = layout clásico.
alter table "public"."shops" add column if not exists "landing_template" text;

-- La policy RLS de UPDATE en shops solo valida ownership, así que el rol
-- authenticated solo puede tocar las columnas explícitamente otorgadas
-- (ver 20260811190000_restrict_shops_update_columns). Sumamos landing_template
-- porque updateShopPersonalization la actualiza a mano desde la UI.
grant update ("landing_template") on table "public"."shops" to "authenticated";
