# AGENTS.md — Marketplace de Comercios

Estándares de código y contexto de arquitectura para revisión automática (GGA) y para cualquier agente/IA que trabaje en este repo.

## Stack

- **Framework:** Next.js (App Router)
- **Backend/DB:** Supabase (Postgres + Auth + Storage + RLS)
- **Estado UI:** Zustand
- **Estado servidor:** React Query
- **Geo/búsqueda:** PostGIS + pg_trgm
- **Estilos:** Tailwind + shadcn/ui, paleta pastel custom (ver `ui-ux-marketplace-pastel.md`)
- **Tipografías:** Sora / Inter / IBM Plex Mono

## Roles del sistema

Tres roles en `profiles.role`: `client`, `shop_admin`, `superadmin`. Cada uno tiene rutas y permisos distintos. **Cualquier cambio de schema o de policy debe declarar explícitamente qué rol puede hacer qué.**

## Reglas de seguridad — no negociables

Estas son las que más nos importa que un reviewer marque como bloqueantes:

1. **RLS activo en toda tabla nueva.** Ninguna tabla en `public` sin `rowsecurity = true` y al menos una policy por comando (SELECT/INSERT/UPDATE/DELETE) que aplique.
2. **Ningún `UPDATE` de shop_admin puede tocar columnas de verificación o suscripción** (`verification_status`, `subscription_*`). Esos cambios solo a través de RPC `security definer` (`approve_shop_verification`, `approve_subscription`) que valide `is_superadmin()` **dentro** de la función, nunca confiando en que el frontend restrinja el acceso.
3. **`get_products_feed` debe filtrar siempre `is_paused = false`.** Si se toca esta función, el reviewer debe confirmar que el filtro sigue presente.
4. **Storage:** cada bucket necesita policy de INSERT/UPDATE/DELETE que valide que el path pertenece al `auth.uid()` del usuario (patrón `shops/{shop_id}/...` con `owner_id` verificado), `file_size_limit` y `allowed_mime_types` restringidos a imágenes.
5. **Nunca confiar en validación solo de frontend** para reglas de negocio o permisos. Todo lo sensible se valida en policy o en RPC.

## Convenciones de código

- **Nombres de carpetas:** `lib/supabase/` (no `supebase`, ver typo conocido que hay que corregir si aparece).
- **Clientes Supabase:** usar `lib/supabase/client.ts` en Client Components y `lib/supabase/server.ts` en Server Components/Route Handlers. Nunca mezclar.
- **Middleware:** debe proteger rutas por rol antes de renderizar; no dejar placeholders (`/* ... */`) mergeados a main.
- **Validación:** schemas Zod en `lib/validations/`, alineados a mano con `database.types.ts`. Si se regenera `database.types.ts`, revisar que los schemas Zod sigan correspondiendo.
- **Rutas agrupadas:** feed público vive en `app/(public)/page.tsx`. No debe existir `app/page.tsx` default de Next.js compitiendo con esa ruta — si aparece, es un bug de routing duplicado.
- **React Query:** todo fetch a Supabase desde el cliente pasa por un hook (`use-products.ts`, etc.), no fetches sueltos en componentes.
- **Zustand:** solo para estado de UI (filtros, onboarding en progreso). Nunca para datos que vienen de Supabase — eso es dominio de React Query.

## Migraciones y seed

- Cambios de schema van versionados en `supabase/migrations/`, no aplicados solo a mano en el dashboard remoto.
- Seed de datos de prueba en `supabase/seed.sql`, no hardcodeado en scripts sueltos.

## Qué debe marcar el reviewer con prioridad alta

- Policies de RLS ausentes o con `qual`/`with_check` demasiado permisivo (ej: `true` sin condición).
- RPC `security definer` sin chequeo de rol dentro del cuerpo.
- Componentes que hacen fetch directo a Supabase sin pasar por React Query.
- Cualquier commit que reintroduzca placeholders en middleware o páginas vacías sin contenido real.
- Falta de manejo de error en operaciones de Storage (upload sin validar tipo/tamaño en frontend, aunque la policy exista server-side).

## Variables de entorno y secretos

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son las únicas keys de Supabase permitidas en código de cliente (prefijo `NEXT_PUBLIC_` a propósito).
- La **service role key** de Supabase nunca debe aparecer en ningún archivo bajo `app/`, `components/`, `lib/`, ni en ningún código que se ejecute en el navegador. Solo en contextos server-only (Route Handlers, Server Actions, scripts locales), leída desde variable de entorno sin el prefijo `NEXT_PUBLIC_`.
- `.env.local` nunca se commitea. Si un PR incluye un `.env.local` o cualquier archivo con una key real (aunque sea de un proyecto de prueba), es bloqueante.
- Si se agrega una variable de entorno nueva, documentarla en `.env.example` (sin valores reales) en el mismo PR.

## Manejo de errores y logging

- Todo hook de React Query debe exponer `isLoading`, `isError` y el componente que lo consume debe manejar los tres estados (loading, error, data) — no asumir que la data siempre está disponible.
- Errores de Supabase (auth, DB, storage) se muestran al usuario con un mensaje entendible, no el error crudo de Postgres. El error técnico va a consola/logging, no a la UI.
- No usar `try/catch` vacíos ni silenciar errores sin loggear. Como mínimo `console.error` con contexto (qué operación falló, con qué input).
- Si en algún punto se agrega una herramienta de error tracking (Sentry u otra), este documento se actualiza para reflejarlo como obligatorio en nuevas features.

## Testing

- MVP: no se exige cobertura de tests unitarios/e2e todavía — prioridad es velocidad de entrega. El reviewer no debe marcar "falta de tests" como bloqueante en esta etapa.
- Excepción: los checks manuales de RLS (`supabase/tests/rls-manual-checks.sql`) sí son obligatorios para cualquier policy nueva o modificada, y deben quedar documentados en el PR (qué se corrió, qué resultado dio).
- Cuando el proyecto pase de MVP a producción estable, este documento se actualiza para exigir tests automatizados — no asumir que "no hay tests" es la regla permanente.

## Convención de commits y PRs

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`. Ejemplo: `feat: agregar filtro is_paused a get_products_feed`.
- Un PR = un cambio lógico. No mezclar fix de seguridad con feature nueva de UI en el mismo PR — dificulta el review y el rollback.
- Todo PR que toque una policy de RLS, una función `security definer`, o una policy de Storage debe incluir en la descripción qué query de verificación se corrió (de las que ya tenemos armadas) y su resultado.
- PRs que agreguen o modifiquen rutas protegidas por rol deben indicar explícitamente qué rol(es) pueden acceder.

## Performance y assets

- Toda imagen (logos de shop, productos, fotos de perfil) se renderiza con `next/image`, nunca `<img>` suelto — así se aprovecha optimización y lazy loading automático.
- Preferir Server Components por default; un componente pasa a Client Component (`'use client'`) solo si necesita interactividad, estado local, o hooks de React Query/Zustand. No marcar árboles enteros como client innecesariamente.
- Queries a Supabase deben pedir solo las columnas necesarias (`select('id, name, price')`), no `select('*')` por default, especialmente en `get_products_feed` que puede devolver muchas filas.
- Paginación o límite explícito en cualquier query que liste productos o shops — nunca traer todo sin límite.

## Accesibilidad e internacionalización

- Proyecto es español únicamente por ahora — no se espera i18n/multi-idioma en esta etapa. No marcar strings hardcodeados en español como problema.
- Accesibilidad básica sí aplica: `alt` en imágenes, labels en inputs de formularios (login, onboarding, dashboard), contraste de color suficiente respetando la paleta pastel definida (si un color pastel no cumple contraste mínimo con el texto, es un bug de diseño a reportar, no a ignorar).
- No se exige cumplimiento WCAG completo en MVP, pero sí estos básicos porque son gratis de implementar bien desde el principio.

## TypeScript y linting

- `tsconfig.json` en modo strict. No se permite `any` implícito ni explícito salvo justificación en comentario (`// any porque ...`). El reviewer debe marcar `any` sin justificar.
- ESLint warnings se tratan como bloqueantes antes de mergear a main, no como sugerencias opcionales.
- Tipos derivados de `database.types.ts` siempre que sea posible, en vez de redefinir interfaces a mano que puedan desincronizarse del schema real.

## Naming: DB vs TypeScript

- Supabase/Postgres genera columnas en `snake_case` (`is_paused`, `owner_id`, `shop_id`).
- Regla del proyecto: **no transformar a camelCase.** El frontend usa los mismos nombres `snake_case` que vienen de `database.types.ts`, en hooks, componentes y stores. Evita una capa de mapeo innecesaria y mantiene una sola fuente de verdad entre DB y frontend.
- Si en algún punto se decide lo contrario (mapear a camelCase), debe hacerse en un solo lugar centralizado (los hooks de React Query), nunca de forma parcial o inconsistente entre componentes.

## RPCs públicas: riesgo de abuso conocido

- `get_products_feed` e `increment_shop_metric` son invocables sin autenticación estricta (necesario para que un visitante anónimo vea el feed y genere métricas de vistas/clicks).
- Esto es un riesgo conocido y aceptado en MVP: alguien puede scrapear el feed agresivamente o falsear métricas de un shop con requests repetidos.
- No se exige rate limiting real todavía, pero cualquier cambio a estas RPCs debe mantener presente este riesgo y no asumir que el caller es siempre legítimo (ej: no exponer en la respuesta más datos de los necesarios, ver sección de datos de contacto).
- Cuando se priorice, el fix es rate limiting a nivel de Supabase Edge Function o middleware, no a nivel de RPC de Postgres.

## Geolocalización y privacidad

- La ubicación del usuario (para el feed geolocalizado con PostGIS) es **opt-in explícito**: nunca se solicita al cargar la página sin una acción del usuario que la pida.
- No se persiste la ubicación del usuario en DB salvo que el flujo lo requiera explícitamente y esté documentado por qué (ej: no guardar "última ubicación conocida" del cliente sin necesidad real de negocio).
- Si se agrega tracking de ubicación en el futuro, debe pasar por este documento primero, no agregarse silenciosamente en un hook.

## Datos de contacto (WhatsApp y similares)

- El número de WhatsApp del shop se valida en formato (código de país + número) antes de guardarse en DB, para que `WhatsAppButton` no genere un link roto.
- La RPC `get_products_feed` (o cualquier RPC que liste múltiples shops) no debe devolver el número de contacto en la respuesta si no es necesario en esa vista — el contacto se expone solo en el detalle del perfil de tienda (`/tienda/[slug]`), no en el listado general, para minimizar exposición de datos personales.

## CI/CD

- Antes de mergear a main: `build`, `typecheck` (`tsc --noEmit`) y `lint` deben pasar. Si hay pipeline de CI configurado, el reviewer no necesita re-verificar estos tres puntos manualmente — solo lo hace si no hay CI corriendo en el PR.
- Si todavía no existe pipeline de CI, este documento se actualiza cuando se agregue, y mientras tanto el reviewer sí valida `build`/`typecheck`/`lint` manualmente como parte del review.

## Fuera de alcance para el reviewer

- Sugerencias de paleta de color o tipografía: eso ya está definido en `ui-ux-marketplace-pastel.md`, no rediscutir salvo inconsistencia real con ese doc (incluyendo el punto de contraste arriba).
- Cambios de stack (framework, ORM, etc.): decisión ya tomada en `arquitectura-marketplace-comercios.md`.
- Falta de tests automatizados en esta etapa (ver sección Testing).
- Falta de soporte multi-idioma (ver sección Accesibilidad e internacionalización).