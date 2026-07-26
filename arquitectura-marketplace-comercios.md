# Marketplace de Comercios Locales — Arquitectura completa

## 1. Resumen del producto

Roles:
- **Superadmin** (vos): crea categorías, aprueba/rechaza verificación de shops, gestiona planes de subscripción y aprueba pagos.
- **Shop admin**: crea su perfil de tienda, carga productos, puede subscribirse para mejorar posicionamiento.
- **Cliente**: puede navegar sin login (público) o loguearse para guardar favoritos y tener perfil.
- **Público (sin login)**: ve el feed, filtra por categoría/nombre/ubicación, ve perfiles de shops y productos.

Flujo clave: al loguearse por primera vez, el usuario elige "crear tienda" o "ser cliente" → esto define su `role` en `profiles`.

---

## 2. Stack tecnológico recomendado

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Next.js 15 (App Router)** | Server Components para el feed público (SEO, carga rápida), Server Actions para mutaciones seguras |
| Estado UI | **Zustand** | Solo para estado de cliente: filtros activos, modales, wizard de "crear tienda", carrito de favoritos temporal |
| Estado servidor/cache | **TanStack Query (React Query)** | No uses Zustand para cachear datos de Supabase — mezclarlo genera bugs de sincronización. Zustand = UI state, React Query = server state |
| Backend | **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) | Todo integrado, RLS nativo |
| Estilos | **Tailwind CSS + shadcn/ui** | Rápido, consistente, accesible |
| Formularios | **react-hook-form + zod** | Validación compartida cliente/servidor con el mismo schema |
| Geolocalización | **PostGIS** (extensión de Postgres, Supabase la soporta) | Búsquedas "cerca de mí" con índices espaciales reales, no Haversine manual |
| Búsqueda | **pg_trgm + tsvector** (Postgres) | Búsqueda fuzzy de productos/shops por nombre sin depender de Algolia/Meilisearch al inicio |
| QR | **`qrcode.react`** (client-side) | Genera el QR apuntando a `tuapp.com/tienda/[slug]`, no necesita backend |
| Imágenes | **Supabase Storage + next/image** | Buckets separados por tipo, transformaciones on-the-fly de Supabase para thumbnails |
| Notificaciones internas | **Supabase Realtime** | Ej: avisar al superadmin cuando hay una solicitud de subscripción pendiente |

**Importante:** nunca uses el `service_role key` de Supabase en el cliente. Solo en Server Actions / Route Handlers / Edge Functions.

---

## 3. Modelo de datos — decisiones de diseño

- Uso **un solo `role` por perfil** (`client` | `shop_admin` | `superadmin`) para simplificar RLS. Si más adelante un cliente quiere abrir su propia tienda, se le permite tener ambos: lo resuelvo con una tabla `shops` vinculada a `owner_id`, no con múltiples roles — el rol solo define permisos de plataforma, no si "tiene o no tiene tienda".
- La verificación de shop y la subscripción son conceptos **separados**: un shop puede estar verificado (identidad real) y no tener plan pago, o viceversa no debería pasar, pero conceptualmente son cosas distintas.
- El posicionamiento en el feed se resuelve con una función SQL (`get_products_feed`) que ordena por `is_featured` (derivado de subscripción activa) → distancia → fecha, para no depender de lógica en el frontend.

---

## 4. Esquema SQL completo

```sql
-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('client', 'shop_admin', 'superadmin');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type subscription_status as enum ('none', 'pending', 'active', 'expired', 'rejected');

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role, -- null hasta que elige en el onboarding
  full_name text,
  avatar_url text,
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES (solo superadmin las crea)
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon_url text,
  parent_id uuid references public.categories(id), -- para subcategorías opcional
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- SHOPS
-- ============================================================
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  cover_url text,
  whatsapp_number text not null,
  email text,
  instagram_url text,

  -- ubicación
  address text,
  location geography(Point, 4326), -- lat/lng vía PostGIS
  city text,

  -- verificación de identidad del emprendimiento
  verification_status verification_status not null default 'pending',
  verification_document_url text, -- foto/doc que sube el shop, privado
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,

  -- subscripción (desnormalizado para queries rápidas del feed)
  subscription_status subscription_status not null default 'none',
  subscription_expires_at timestamptz,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shops_location on public.shops using gist (location);
create index idx_shops_category on public.shops (category_id);
create index idx_shops_slug on public.shops (slug);
create index idx_shops_search on public.shops using gin (name gin_trgm_ops);

-- ============================================================
-- SUBSCRIPTION PLANS (los define el superadmin)
-- ============================================================
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,           -- ej: "Destacado mensual"
  description text,
  price numeric(10,2) not null,
  duration_days int not null,
  benefits jsonb,                -- ej: {"priority_boost": 10, "badge": true}
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS (solicitudes de shops, las aprueba el superadmin)
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status subscription_status not null default 'pending',
  payment_proof_url text, -- comprobante que sube el shop admin
  start_date timestamptz,
  end_date timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_shop on public.subscriptions (shop_id);
create index idx_subscriptions_status on public.subscriptions (status);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price numeric(10,2),
  currency text not null default 'ARS',
  is_active boolean not null default true,
  search_vector tsvector generated always as (
    to_tsvector('spanish', unaccent(coalesce(name,'') || ' ' || coalesce(description,'')))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_shop on public.products (shop_id);
create index idx_products_category on public.products (category_id);
create index idx_products_search on public.products using gin (search_vector);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FAVORITES (clientes guardan productos)
-- ============================================================
create table public.favorites (
  client_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, product_id)
);
```

### 4.1 Función RPC para el feed con orden de subscripción + distancia

```sql
create or replace function public.get_products_feed(
  user_lat float default null,
  user_lng float default null,
  p_category_id uuid default null,
  p_search text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  product_id uuid,
  product_name text,
  price numeric,
  shop_id uuid,
  shop_name text,
  shop_is_featured boolean,
  distance_km float,
  main_image text
) as $$
begin
  return query
  select
    p.id,
    p.name,
    p.price,
    s.id,
    s.name,
    (s.subscription_status = 'active') as shop_is_featured,
    case when user_lat is not null and s.location is not null
      then ST_Distance(s.location, ST_MakePoint(user_lng, user_lat)::geography) / 1000
      else null
    end as distance_km,
    (select url from product_images pi where pi.product_id = p.id order by sort_order limit 1)
  from products p
  join shops s on s.id = p.shop_id
  where p.is_active = true
    and s.is_active = true
    and (p_category_id is null or p.category_id = p_category_id)
    and (p_search is null or p.search_vector @@ plainto_tsquery('spanish', unaccent(p_search)))
  order by
    shop_is_featured desc,          -- subscritos primero
    distance_km asc nulls last,     -- luego por cercanía
    p.created_at desc               -- luego más nuevos
  limit p_limit offset p_offset;
end;
$$ language plpgsql stable;
```

Esto centraliza el ranking en la base, así el frontend no reimplementa la lógica de negocio del posicionamiento pago.

---

## 5. Row Level Security (RLS)

Habilitá RLS en **todas** las tablas. Ejemplo de las políticas clave:

```sql
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.categories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.favorites enable row level security;

-- Helper: saber si el usuario actual es superadmin
create or replace function public.is_superadmin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'superadmin'
  );
$$ language sql security definer stable;

-- PROFILES
create policy "usuarios ven y editan su propio perfil"
  on public.profiles for select using (auth.uid() = id or is_superadmin());
create policy "usuarios actualizan su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- CATEGORIES: lectura pública, escritura solo superadmin
create policy "categorias son públicas" on public.categories
  for select using (true);
create policy "solo superadmin crea categorias" on public.categories
  for insert with check (is_superadmin());
create policy "solo superadmin edita categorias" on public.categories
  for update using (is_superadmin());

-- SHOPS: lectura pública de shops activos, escritura del dueño
create policy "shops activos son públicos" on public.shops
  for select using (is_active = true or owner_id = auth.uid() or is_superadmin());
create policy "shop admin crea su propio shop" on public.shops
  for insert with check (owner_id = auth.uid());
create policy "shop admin edita su propio shop" on public.shops
  for update using (owner_id = auth.uid() or is_superadmin());
-- Nota: la verificación (verification_status, verified_by) solo la debe poder tocar el
-- superadmin -> conviene mover esos campos a un UPDATE restringido vía función RPC
-- security definer en vez de permitir UPDATE libre de esas columnas.

-- PRODUCTS: lectura pública si el producto y el shop están activos
create policy "productos públicos" on public.products
  for select using (
    is_active = true
    or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
    or is_superadmin()
  );
create policy "shop admin gestiona sus productos" on public.products
  for insert with check (
    exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "shop admin edita sus productos" on public.products
  for update using (
    exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
    or is_superadmin()
  );
create policy "shop admin borra sus productos" on public.products
  for delete using (
    exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- SUBSCRIPTIONS: el shop ve las suyas, solo superadmin aprueba
create policy "shop ve sus subscripciones" on public.subscriptions
  for select using (
    exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
    or is_superadmin()
  );
create policy "shop crea solicitud de subscripción" on public.subscriptions
  for insert with check (
    exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "solo superadmin aprueba subscripciones" on public.subscriptions
  for update using (is_superadmin());

-- SUBSCRIPTION_PLANS: lectura pública, escritura solo superadmin
create policy "planes son públicos" on public.subscription_plans
  for select using (is_active = true or is_superadmin());
create policy "solo superadmin gestiona planes" on public.subscription_plans
  for all using (is_superadmin());

-- FAVORITES: solo el propio cliente
create policy "cliente gestiona sus favoritos" on public.favorites
  for all using (client_id = auth.uid());
```

**Punto importante de seguridad:** el `UPDATE` de `shops` tal como está permite que el propio shop admin edite `verification_status`. Para evitar eso, lo correcto es:
1. Sacar esas columnas sensibles del `UPDATE` policy normal (con una política más granular a nivel de columna vía trigger `BEFORE UPDATE` que revierta cambios no autorizados), o
2. Exponer una función RPC `approve_shop_verification(shop_id, status)` con `security definer`, invocable solo si `is_superadmin()`, y quitar el permiso de tocar esas columnas al shop admin.

La opción 2 es más prolija y la recomiendo para verificación y aprobación de subscripciones también.

---

## 6. Supabase Storage — buckets

| Bucket | Público | Contenido |
|---|---|---|
| `shop-logos` | Público | Logos de tiendas |
| `shop-covers` | Público | Portadas de tiendas |
| `product-images` | Público | Fotos de productos |
| `verification-docs` | **Privado** | Documento/foto que prueba que el shop es real. Acceso solo vía signed URL, solo dueño + superadmin |
| `payment-proofs` | **Privado** | Comprobantes de pago de subscripción. Solo dueño + superadmin |

Políticas de storage van en paralelo a las de la tabla (mismo criterio: `owner_id = auth.uid()` o `is_superadmin()`).

---

## 7. Geolocalización

- Guardá `location geography(Point,4326)` en `shops`, seteado desde el navegador (`navigator.geolocation`) o buscando la dirección con una API de geocoding (ej. Nominatim/OpenStreetMap, gratis) cuando el shop carga su dirección.
- Para el feed público, pedí permiso de geolocalización al usuario; si no lo da, mostrá el feed ordenado solo por `subscription_status` + fecha (fallback razonable).
- El índice `GIST` sobre `location` hace que `ST_Distance` / `ST_DWithin` sean rápidos incluso con miles de shops.

---

## 8. QR de perfil de tienda

No necesita tabla nueva. En el perfil del shop admin:

```tsx
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG value={`https://tuapp.com/tienda/${shop.slug}`} size={200} />
```

Opcional: agregar botón "descargar QR como PNG" (canvas) para que el comercio lo imprima y lo pegue en el local.

---

## 9. Buenas prácticas transversales

**Seguridad**
- RLS en todas las tablas, sin excepción, desde el día 1 (no lo dejes para "después").
- Nunca confíes en el rol que viene del cliente: siempre verificá `role`/`is_superadmin()` en la base, no en el frontend.
- Operaciones sensibles (aprobar verificación, aprobar subscripción) van en funciones `security definer`, no en `UPDATE` directo desde el cliente.
- `service_role key` solo en el servidor (Server Actions, Route Handlers).

**Estado (Zustand vs React Query)**
- Zustand: filtros del feed (categoría, texto, ubicación seleccionada), estado de UI (modales, wizard de onboarding, pasos del formulario de "crear tienda").
- React Query: todo lo que venga de Supabase (productos, shops, subscripciones). Te da caching, refetch automático, y estados de loading/error sin reinventar la rueda.
- Nunca guardes datos de Supabase "crudos" en Zustand como fuente de verdad — se desincroniza.

**Next.js**
- El feed público y las páginas de shop/producto van como **Server Components** (fetch directo con el cliente de Supabase server-side) para SEO y para que carguen rápido sin esperar JS del cliente.
- Las áreas de dashboard (shop admin, superadmin) sí pueden ser Client Components con React Query, porque no necesitan SEO.
- Middleware de Next.js para proteger rutas `/dashboard/*` y `/admin/*` según `role`, chequeando la sesión de Supabase.

**Modelo de negocio / onboarding**
- Al primer login, si `profiles.role is null`, redirigí a una pantalla obligatoria "¿Querés crear tu tienda o sos cliente?" antes de dejar navegar al dashboard.
- Un shop admin sin subscripción activa igual puede operar 100% (cuenta gratuita) — la subscripción es un booster de visibilidad, no un gate de funcionalidad. Esto ya está reflejado en el diseño (products no depende de subscription_status).

**Escalabilidad futura** (para no bloquear el modelo de datos ahora)
- `reviews`/calificaciones de shops: tabla nueva, no rompe nada existente.
- Multi-imagen con orden de arrastre: ya contemplado con `product_images.sort_order`.
- Chat interno en vez de solo WhatsApp: se agregaría después, no afecta el esquema actual.
- Checkout / pagos reales: cuando llegue ese momento, `products` necesitará `stock`, y aparecerá una tabla `orders` — el esquema actual no lo bloquea.

---

## 9.1 Addendum — piezas que faltaban en el esquema inicial

### Trigger genérico de `updated_at`

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_shops_updated_at before update on public.shops
  for each row execute procedure public.set_updated_at();
create trigger trg_products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
```

### Sincronizar `shops.subscription_status` automáticamente

Evita que tengas que actualizar el shop a mano cada vez que cambia una subscripción — lo hace la base sola cuando vos (superadmin) apruebas una fila en `subscriptions`.

```sql
create or replace function public.sync_shop_subscription_status()
returns trigger as $$
begin
  if new.status = 'active' then
    update public.shops
      set subscription_status = 'active',
          subscription_expires_at = new.end_date
      where id = new.shop_id;
  elsif new.status in ('expired', 'rejected') then
    update public.shops
      set subscription_status = new.status
      where id = new.shop_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_sync_shop_subscription
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_shop_subscription_status();
```

### Expiración automática de subscripciones vencidas

Usa `pg_cron` (extensión disponible en Supabase) para correr esto una vez por día.

```sql
create extension if not exists pg_cron;

create or replace function public.expire_subscriptions()
returns void as $$
begin
  update public.subscriptions
    set status = 'expired'
    where status = 'active' and end_date < now();

  update public.shops
    set subscription_status = 'expired'
    where subscription_status = 'active'
      and subscription_expires_at < now();
end;
$$ language plpgsql security definer;

select cron.schedule('expire-subscriptions-daily', '0 3 * * *', 'select public.expire_subscriptions()');
```

### Horarios y pausa temporal del shop

```sql
alter table public.shops
  add column business_hours jsonb, -- ej: {"mon":{"open":"09:00","close":"18:00"}, "sun":null}
  add column is_paused boolean not null default false,
  add column paused_reason text;
```

En el feed público, el filtro de `select` ya usa `is_active = true`; agregá `and is_paused = false` a la función `get_products_feed` para que un shop en pausa no aparezca sin tener que borrar nada.

### Reportar shop

```sql
create type report_reason as enum ('fake_product', 'scam', 'inappropriate', 'closed_permanently', 'other');
create type report_status as enum ('pending', 'reviewed', 'dismissed');

create table public.shop_reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  reported_by uuid references public.profiles(id), -- null si lo reporta alguien no logueado
  reason report_reason not null,
  comment text,
  status report_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.shop_reports enable row level security;

create policy "cualquiera puede reportar" on public.shop_reports
  for insert with check (true);
create policy "solo superadmin ve y gestiona reportes" on public.shop_reports
  for select using (is_superadmin());
create policy "solo superadmin actualiza reportes" on public.shop_reports
  for update using (is_superadmin());
```

### Analíticas básicas (vistas de perfil y clics a WhatsApp)

Contadores simples en vez de una tabla de eventos por click (evita escrituras excesivas); si más adelante necesitás series temporales, se agrega una tabla de eventos aparte sin romper esto.

```sql
alter table public.shops
  add column profile_views bigint not null default 0,
  add column whatsapp_clicks bigint not null default 0;

create or replace function public.increment_shop_metric(p_shop_id uuid, p_metric text)
returns void as $$
begin
  if p_metric = 'view' then
    update public.shops set profile_views = profile_views + 1 where id = p_shop_id;
  elsif p_metric = 'whatsapp_click' then
    update public.shops set whatsapp_clicks = whatsapp_clicks + 1 where id = p_shop_id;
  end if;
end;
$$ language plpgsql security definer;
```

Se llama desde el frontend con `supabase.rpc('increment_shop_metric', { p_shop_id, p_metric: 'whatsapp_click' })`. Al ser `security definer`, no necesita policy de `update` abierta en `shops` para esto.

### Audit log de acciones del superadmin

Trazabilidad de aprobaciones/rechazos — útil si un shop reclama "por qué me rechazaron".

```sql
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,          -- ej: 'shop_verified', 'subscription_approved'
  target_table text not null,
  target_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
create policy "solo superadmin lee audit log" on public.audit_log
  for select using (is_superadmin());
create policy "solo superadmin escribe audit log" on public.audit_log
  for insert with check (is_superadmin());
```

### Notificaciones internas para el superadmin

```sql
create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,            -- 'new_verification_request' | 'new_subscription_request' | 'new_report'
  reference_id uuid not null,    -- id del shop, subscription o report
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_notifications enable row level security;
create policy "solo superadmin ve notificaciones" on public.admin_notifications
  for select using (is_superadmin());
```

Se puede poblar automáticamente con triggers `after insert` en `shops` (cuando `verification_status = 'pending'`) y en `subscriptions`. Combinado con Supabase Realtime, el panel de superadmin puede mostrar el contador de pendientes sin hacer polling.

### Soft delete en shops

Si un shop se da de baja no conviene borrar la fila (rompe el historial de `products`, `subscriptions`, `audit_log` referenciados). Mejor:

```sql
alter table public.shops add column deleted_at timestamptz;
```

Y cambiar el filtro de las policies públicas de `is_active = true` a `is_active = true and deleted_at is null`. El `DELETE` desde la app en realidad hace un `UPDATE shops SET deleted_at = now(), is_active = false`.

---

## 10. Resumen de mi recomendación

1. Empezá con Next.js App Router + Supabase + Zustand + React Query tal como está armado acá; es el combo estándar para este tipo de producto y tiene mucha documentación.
2. Meté RLS y las funciones `security definer` para verificación/subscripción **desde el primer sprint**, no lo dejes para el final — es mucho más difícil de retrofit.
3. Usá la función RPC `get_products_feed` en vez de hacer el ranking en el cliente: control centralizado del negocio (quién aparece primero) y evita que alguien manipule el orden desde el frontend.
4. Arrancá con geocoding manual (el shop tipea su dirección y vos la convertís a lat/lng con Nominatim) antes de pedirle al usuario que arrastre un pin en un mapa — es más rápido de construir y suficiente para el MVP.
