-- Nuevo rubro "Estética" (servicio) que agrupa centro de estética,
-- salón de belleza y spa facial como subcategorías.

insert into public.categories (id, name, slug, parent_id, is_service, is_active)
values
  ('e5444444-4444-4444-4444-444444444444', 'Estética', 'estetica', null, true, true);

insert into public.categories (id, name, slug, parent_id, is_service, is_active)
values
  ('e5000001-0000-0000-0000-000000000000', 'Centro de estética', 'estetica-centro-estetico', 'e5444444-4444-4444-4444-444444444444', false, true),
  ('e5000002-0000-0000-0000-000000000000', 'Salón de belleza', 'estetica-salon-belleza', 'e5444444-4444-4444-4444-444444444444', false, true),
  ('e5000003-0000-0000-0000-000000000000', 'Spa facial', 'estetica-spa-facial', 'e5444444-4444-4444-4444-444444444444', false, true);
