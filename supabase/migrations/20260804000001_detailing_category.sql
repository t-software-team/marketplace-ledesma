-- Nuevo rubro "Detailing" (servicio) con sus subcategorías.

insert into public.categories (id, name, slug, parent_id, is_service, is_active)
values
  ('f3444444-4444-4444-4444-444444444444', 'Detailing', 'detailing', null, true, true);

insert into public.categories (id, name, slug, parent_id, is_service, is_active)
values
  ('f3000010-0000-0000-0000-000000000000', 'Lavado premium', 'detailing-lavado-premium', 'f3444444-4444-4444-4444-444444444444', false, true),
  ('f3000011-0000-0000-0000-000000000000', 'Pulido y encerado', 'detailing-pulido-encerado', 'f3444444-4444-4444-4444-444444444444', false, true),
  ('f3000012-0000-0000-0000-000000000000', 'Protección cerámica', 'detailing-proteccion-ceramica', 'f3444444-4444-4444-4444-444444444444', false, true),
  ('f3000013-0000-0000-0000-000000000000', 'Limpieza y detallado interior', 'detailing-interior', 'f3444444-4444-4444-4444-444444444444', false, true),
  ('f3000014-0000-0000-0000-000000000000', 'Polarizado de vidrios', 'detailing-polarizado', 'f3444444-4444-4444-4444-444444444444', false, true),
  ('f3000015-0000-0000-0000-000000000000', 'Restauración de faros', 'detailing-restauracion-faros', 'f3444444-4444-4444-4444-444444444444', false, true);
