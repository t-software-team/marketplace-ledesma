-- ============================================================
-- supabase/seed.sql
-- Datos de prueba mínimo para el marketplace Ledesma.
-- Usar UUIDs fijos para que las pruebas sean determinísticas.
-- Ejecutar con: supabase db reset (o supabase db push desde local)
-- ============================================================

-- -----------------------------------------------------------
-- 0. Usuarios de auth (profiles.id referencia auth.users.id).
--    handle_new_user() crea el profile automáticamente al insertar
--    acá, así que después solo hace falta setear role/phone.
-- -----------------------------------------------------------
-- IMPORTANTE: confirmation_token/recovery_token/email_change/email_change_token_new
-- deben quedar '' (nunca NULL) o GoTrue explota con "Database error querying schema"
-- al escanear esas columnas como string no-nullable en el login por password.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'superadmin@ledesma.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Super Admin Ledesma"}'::jsonb,
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'cliente@ledesma.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Test"}'::jsonb,
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'shopadmin@ledesma.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin Comercio Test"}'::jsonb,
   '', '', '', '')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 0.1 Identidades (GoTrue las crea siempre en un signup real;
--     sin esto el login por password también falla).
-- -----------------------------------------------------------
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', u.id::text, now(), now(), now()
from auth.users u
where u.id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- -----------------------------------------------------------
-- 1-3. Completar role/phone de los profiles creados por el trigger
-- -----------------------------------------------------------
update public.profiles set role = 'superadmin', phone = '+5491112345678'
  where id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'client', phone = '+5491198765432'
  where id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'shop_admin', phone = '+5491122334455'
  where id = '00000000-0000-0000-0000-000000000003';

-- -----------------------------------------------------------
-- 4. Categorías activas (4 categorías de ejemplo)
-- -----------------------------------------------------------
insert into public.categories (id, name, slug, is_active, created_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Farmacias', 'farmacias', true, '00000000-0000-0000-0000-000000000001'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Almacenes', 'almacenes', true, '00000000-0000-0000-0000-000000000001'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Carnicerías', 'carnicerias', true, '00000000-0000-0000-0000-000000000001'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Peluquerías', 'peluquerias', true, '00000000-0000-0000-0000-000000000001'),
  ('e1111111-1111-1111-1111-111111111111', 'Talleres', 'talleres', true, '00000000-0000-0000-0000-000000000001'),
  ('f1111111-1111-1111-1111-111111111111', 'Salud y bienestar', 'salud-y-bienestar', true, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 4.1 Subcategorías (parent_id = rubro top-level) — se eligen al
--     cargar un producto/servicio, no al crear el shop.
-- -----------------------------------------------------------
insert into public.categories (id, name, slug, is_active, parent_id, created_by)
values
  ('a1000001-0000-0000-0000-000000000000', 'Medicamentos', 'farmacias-medicamentos', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
  ('a1000002-0000-0000-0000-000000000000', 'Cuidado personal', 'farmacias-cuidado-personal', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
  ('a1000003-0000-0000-0000-000000000000', 'Cosmética', 'farmacias-cosmetica', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
  ('a1000004-0000-0000-0000-000000000000', 'Suplementos y vitaminas', 'farmacias-suplementos-vitaminas', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),
  ('a1000005-0000-0000-0000-000000000000', 'Primeros auxilios', 'farmacias-primeros-auxilios', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001'),

  ('b1000001-0000-0000-0000-000000000000', 'Lácteos', 'almacenes-lacteos', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001'),
  ('b1000002-0000-0000-0000-000000000000', 'Gaseosas y bebidas', 'almacenes-gaseosas-bebidas', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001'),
  ('b1000003-0000-0000-0000-000000000000', 'Almacén y comestibles', 'almacenes-comestibles', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001'),
  ('b1000004-0000-0000-0000-000000000000', 'Snacks y golosinas', 'almacenes-snacks-golosinas', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001'),
  ('b1000005-0000-0000-0000-000000000000', 'Panificados', 'almacenes-panificados', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001'),
  ('b1000006-0000-0000-0000-000000000000', 'Limpieza y hogar', 'almacenes-limpieza-hogar', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001'),

  ('c1000001-0000-0000-0000-000000000000', 'Vacuno', 'carnicerias-vacuno', true, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001'),
  ('c1000002-0000-0000-0000-000000000000', 'Cerdo', 'carnicerias-cerdo', true, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001'),
  ('c1000003-0000-0000-0000-000000000000', 'Pollo', 'carnicerias-pollo', true, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001'),
  ('c1000004-0000-0000-0000-000000000000', 'Embutidos y fiambres', 'carnicerias-embutidos-fiambres', true, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001'),
  ('c1000005-0000-0000-0000-000000000000', 'Achuras', 'carnicerias-achuras', true, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001'),

  ('d1000001-0000-0000-0000-000000000000', 'Corte de cabello', 'peluquerias-corte', true, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001'),
  ('d1000002-0000-0000-0000-000000000000', 'Color y mechas', 'peluquerias-color-mechas', true, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001'),
  ('d1000003-0000-0000-0000-000000000000', 'Peinados y brushing', 'peluquerias-peinados-brushing', true, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001'),
  ('d1000004-0000-0000-0000-000000000000', 'Tratamientos capilares', 'peluquerias-tratamientos-capilares', true, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001'),
  ('d1000005-0000-0000-0000-000000000000', 'Barbería', 'peluquerias-barberia', true, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001'),

  ('e1000001-0000-0000-0000-000000000000', 'Mecánica general', 'talleres-mecanica-general', true, 'e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('e1000002-0000-0000-0000-000000000000', 'Electricidad del automotor', 'talleres-electricidad-automotor', true, 'e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('e1000003-0000-0000-0000-000000000000', 'Gomería', 'talleres-gomeria', true, 'e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('e1000004-0000-0000-0000-000000000000', 'Chapa y pintura', 'talleres-chapa-pintura', true, 'e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('e1000005-0000-0000-0000-000000000000', 'Service y mantenimiento', 'talleres-service-mantenimiento', true, 'e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),

  ('f1000001-0000-0000-0000-000000000000', 'Odontología', 'salud-odontologia', true, 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('f1000002-0000-0000-0000-000000000000', 'Estética y spa', 'salud-estetica-spa', true, 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('f1000003-0000-0000-0000-000000000000', 'Nutrición', 'salud-nutricion', true, 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('f1000004-0000-0000-0000-000000000000', 'Kinesiología', 'salud-kinesiologia', true, 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('f1000005-0000-0000-0000-000000000000', 'Psicología', 'salud-psicologia', true, 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('f1000006-0000-0000-0000-000000000000', 'Médico general', 'salud-medico-general', true, 'f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 4.2 Rubros adicionales: Tienda de ropa, Librería, Alquileres, Comercio
-- -----------------------------------------------------------
insert into public.categories (id, name, slug, is_active, parent_id, created_by)
values
  ('a2222222-2222-2222-2222-222222222222', 'Tienda de ropa', 'tienda-de-ropa', true, null, '00000000-0000-0000-0000-000000000001'),
  ('b2222222-2222-2222-2222-222222222222', 'Librería', 'libreria', true, null, '00000000-0000-0000-0000-000000000001'),
  ('c2222222-2222-2222-2222-222222222222', 'Alquileres', 'alquileres', true, null, '00000000-0000-0000-0000-000000000001'),
  ('d2222222-2222-2222-2222-222222222222', 'Comercio', 'comercio', true, null, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.categories (id, name, slug, is_active, parent_id, created_by)
values
  ('a2000001-0000-0000-0000-000000000000', 'Ropa de mujer', 'ropa-mujer', true, 'a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('a2000002-0000-0000-0000-000000000000', 'Ropa de hombre', 'ropa-hombre', true, 'a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('a2000003-0000-0000-0000-000000000000', 'Ropa de niños', 'ropa-ninos', true, 'a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('a2000004-0000-0000-0000-000000000000', 'Calzado', 'calzado', true, 'a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('a2000005-0000-0000-0000-000000000000', 'Accesorios', 'accesorios-ropa', true, 'a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),

  ('b2000001-0000-0000-0000-000000000000', 'Libros', 'libros', true, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('b2000002-0000-0000-0000-000000000000', 'Útiles escolares', 'utiles-escolares', true, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('b2000003-0000-0000-0000-000000000000', 'Papelería', 'papeleria', true, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('b2000004-0000-0000-0000-000000000000', 'Arte y manualidades', 'arte-manualidades', true, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('b2000005-0000-0000-0000-000000000000', 'Oficina', 'oficina', true, 'b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),

  ('c2000001-0000-0000-0000-000000000000', 'Inmuebles', 'inmuebles', true, 'c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('c2000002-0000-0000-0000-000000000000', 'Vehículos', 'vehiculos', true, 'c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('c2000003-0000-0000-0000-000000000000', 'Equipos y herramientas', 'equipos-herramientas', true, 'c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('c2000004-0000-0000-0000-000000000000', 'Salones y eventos', 'salones-eventos', true, 'c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('c2000005-0000-0000-0000-000000000000', 'Ropa y disfraces', 'ropa-disfraces', true, 'c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),

  ('d2000001-0000-0000-0000-000000000000', 'Electrónica', 'electronica', true, 'd2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('d2000002-0000-0000-0000-000000000000', 'Hogar', 'hogar', true, 'd2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('d2000003-0000-0000-0000-000000000000', 'Ferretería', 'ferreteria', true, 'd2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('d2000004-0000-0000-0000-000000000000', 'Regalos', 'regalos', true, 'd2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('d2000005-0000-0000-0000-000000000000', 'Varios', 'varios', true, 'd2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 4.3 Rubro: Comida
-- -----------------------------------------------------------
insert into public.categories (id, name, slug, is_active, parent_id, created_by)
values
  ('e2222222-2222-2222-2222-222222222222', 'Comida', 'comida', true, null, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.categories (id, name, slug, is_active, parent_id, created_by)
values
  ('e2000001-0000-0000-0000-000000000000', 'Platos preparados', 'platos-preparados', true, 'e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('e2000002-0000-0000-0000-000000000000', 'Panadería y repostería', 'panaderia-reposteria', true, 'e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('e2000003-0000-0000-0000-000000000000', 'Rotisería', 'rotiseria', true, 'e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('e2000004-0000-0000-0000-000000000000', 'Bebidas', 'bebidas-comida', true, 'e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('e2000005-0000-0000-0000-000000000000', 'Menú del día / Viandas', 'menu-viandas', true, 'e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 5. Shop verificada y activa del shop_admin
-- -----------------------------------------------------------
insert into public.shops (
  id, owner_id, name, slug, description, email, whatsapp_number,
  address, city, category_id, is_active, is_paused, paused_reason,
  verification_status, verification_document_url, verified_at, verified_by,
  subscription_status, subscription_expires_at, location,
  logo_url, cover_url, business_hours, instagram_url
)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000003',    -- owner = shop_admin
  'Comercio Test Ledesma',
  'comercio-test-ledesma',
  'Descripción del comercio de prueba. Productos frescos y calidad garantizada.',
  'contacto@comerciotest.com',
  '+5491133334444',
  'Calle Falsa 123',
  'Buenos Aires',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',      -- categoría Farmacias
  true,                                        -- is_active
  false,                                       -- is_paused
  null,                                        -- paused_reason
  'verified',                                  -- verification_status
  'https://storage.example.com/verification-documents/shops/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/doc.pdf',
  now(),                                       -- verified_at
  '00000000-0000-0000-0000-000000000001',    -- verified_by = superadmin
  'none',                                      -- subscription_status
  null,                                        -- subscription_expires_at
  ST_SetSRID(ST_MakePoint(-58.3816, -34.6037), 4326)::geography,  -- Buenos Aires
  'https://placehold.co/200x200?text=Logo',
  'https://placehold.co/1200x400?text=Cover',
  '{"lunes": "09:00-18:00", "martes": "09:00-18:00", "miercoles": "09:00-18:00", "jueves": "09:00-18:00", "viernes": "09:00-18:00"}'::jsonb,
  'https://instagram.com/comerciotedes'
)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 6. Plan de suscripción activo: Free (hasta 30 productos)
-- -----------------------------------------------------------
insert into public.subscription_plans (id, name, description, price, duration_days, is_active, benefits)
values (
  '11111111-1111-1111-1111-111111111111',
  'Free',
  'Hasta 30 productos o servicios.',
  0,
  30,
  true,
  '{"max_products": 30, "featured": false, "analytics": false}'::jsonb
)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 7. Plan de suscripción activo: Plan 100 (hasta 100 productos, $3000)
-- -----------------------------------------------------------
insert into public.subscription_plans (id, name, description, price, duration_days, is_active, benefits)
values (
  '22222222-2222-2222-2222-222222222222',
  'Plan 100',
  'Hasta 100 productos o servicios, con destacado en el feed.',
  3000,
  30,
  true,
  '{"max_products": 100, "featured": true, "analytics": true}'::jsonb
)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 7.1 Plan de suscripción activo: Plan Ilimitado (más de 100 productos, $7000)
-- -----------------------------------------------------------
insert into public.subscription_plans (id, name, description, price, duration_days, is_active, benefits)
values (
  '33333333-4444-4444-4444-444444444444',
  'Plan Ilimitado',
  'Más de 100 productos o servicios, sin límite, con destacado y soporte prioritario.',
  7000,
  30,
  true,
  '{"max_products": null, "featured": true, "analytics": true, "priority_support": true}'::jsonb
)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 8. Suscripción activa para la shop_test (plan Pro)
-- -----------------------------------------------------------
insert into public.subscriptions (
  id, shop_id, plan_id, status, start_date, end_date, approved_at, approved_by
)
values (
  '33333333-3333-3333-3333-333333333333',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '22222222-2222-2222-2222-222222222222',
  'active',
  now(),
  now() + interval '30 days',
  now(),
  '00000000-0000-0000-0000-000000000001'    -- approved_by = superadmin
)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 9. 2-3 productos asociados a la shop_test
-- -----------------------------------------------------------
insert into public.products (id, name, description, price, currency, shop_id, category_id, is_active)
values
  ('44444444-4444-4444-4444-444444444444', 'Producto Farmacia 1', 'Descripción del producto de farmacia de prueba.', 1500, 'ARS', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('55555555-5555-5555-5555-555555555555', 'Producto Farmacia 2', 'Otro producto de farmacia de ejemplo.', 2800, 'ARS', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('66666666-6666-6666-6666-666666666666', 'Producto Almacén 1', 'Producto para el almacén de prueba.', 800, 'ARS', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 10. Imágenes de productos (1 por producto)
-- -----------------------------------------------------------
insert into public.product_images (id, product_id, url, sort_order)
values
  ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'https://placehold.co/600x600?text=Producto+1', 1),
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'https://placehold.co/600x600?text=Producto+2', 1),
  ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'https://placehold.co/600x600?text=Producto+3', 1)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 11. Favorito del cliente test
-- -----------------------------------------------------------
insert into public.favorites (client_id, product_id)
values ('00000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444')
on conflict (client_id, product_id) do nothing;

-- -----------------------------------------------------------
-- 12. Notificación de admin de prueba
-- -----------------------------------------------------------
insert into public.admin_notifications (id, type, reference_id, is_read)
values ('a1111111-1111-1111-1111-111111111111', 'shop_verified', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- 13. Reporte de comercio de prueba
-- -----------------------------------------------------------
insert into public.shop_reports (id, shop_id, reported_by, reason, status, comment)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000002',
  'fake_product',
  'pending',
  'Producto con precio sospechosamente bajo.'
)
on conflict (id) do nothing;