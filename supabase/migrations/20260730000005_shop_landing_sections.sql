-- Fixed, curated landing sections for Plan Ilimitado shops — not a free
-- page builder. Each section has a known, structured shape (no raw HTML),
-- so there's no XSS surface and the renderer stays a simple fixed switch.
-- Render order on the public page is hardcoded: banner -> services -> video
-- -> products (existing) -> reviews (existing).

alter table public.shops
  add column if not exists landing_banner jsonb,
  add column if not exists landing_services jsonb,
  add column if not exists landing_video_url text;
