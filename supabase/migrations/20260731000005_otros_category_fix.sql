-- ============================================================
-- 20260731000005_otros_category_fix.sql
-- La migración 20260731000004 usó un UUID que ya pertenecía a
-- "Bandas musicales" (creada manualmente antes de versionar
-- migraciones); el insert quedó descartado en silencio por el
-- "on conflict (id) do nothing". Reintenta con un id libre.
-- ============================================================

insert into public.categories (id, name, slug, is_active, parent_id, is_service)
values (
  'ffffffff-9999-9999-9999-999999999999',
  'Otros',
  'otros',
  true,
  null,
  false
)
on conflict (slug) do nothing
