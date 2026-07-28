-- ============================================================
-- 20260728000014_shop_social_links.sql
-- Suma Facebook y sitio web propio a los datos de contacto del
-- comercio (ya existía instagram_url).
-- ============================================================
alter table public.shops
  add column if not exists facebook_url text null,
  add column if not exists website_url text null;
