# Pendientes / Deuda técnica

Deudas detectadas durante el trabajo de performance (agosto 2026). Ninguna es
bloqueante hoy; se anotan para atacarlas en sesiones dedicadas.

## 1. Backfill de thumbnails de productos faltantes

**Contexto:** en el feed (`/`), algunos productos piden su thumbnail
(`...-thumb.webp`) y el request falla con `net::ERR_BLOCKED_BY_ORB` porque el
archivo no existe en Supabase Storage; el frontend cae al fallback y descarga
la imagen full-size (más pesada). El fallback ya está bien implementado en
`src/components/shared/product-image.tsx`.

**Causa:** la generación de thumbnails (`buildThumbnail` en
`src/lib/shops/upload-image.ts`) es best-effort client-side y se agregó después
de que ya había productos cargados. Las fotos subidas antes, o los uploads
donde `buildThumbnail` falló silenciosamente (GIFs, imágenes no legibles,
canvas no disponible), no tienen archivo `-thumb.webp`.

**Impacto:** bajo. Más ancho de banda y carga más lenta solo para productos
puntuales (viejos), notorio en mobile/redes lentas. No bloquea el render.

**Fix propuesto:** script de backfill (one-shot, server-side) que liste
`product-images` en Storage, detecte los que no tienen su `-thumb.webp`
hermano, y los regenere. No existe ningún script así en el repo.

## 2. Política de manejo de errores en queries de admin

**Contexto:** casi todas las funciones de `src/lib/admin/queries.ts` (y
`src/server/admin-users-directory.ts`) capturan el error de Supabase, lo
loguean con `console.error` y devuelven un fallback vacío (`[]`/`null`). Esto
deja un fallo real (RLS, red, etc.) indistinguible de "no hay datos" para el
admin: la UI muestra un empty state en ambos casos.

**Estado:** ya se agregó el `console.error` con contexto en todas (antes ni
siquiera se logueaba). Falta la decisión de arquitectura.

**Decisión pendiente:** definir si las queries de admin deben **propagar** el
error (`throw`, y que un error boundary / mensaje visible lo muestre al admin)
en vez de degradar silenciosamente a lista vacía. Es una decisión transversal
a todo el módulo admin, no de una función suelta. El gate de review (`gga`) lo
marca como violación de la sección "Manejo de errores y logging" de AGENTS.md.

**Nota:** el commit `7f4440d` se hizo con `--no-verify` justamente por este
punto — el código quedó mejor que antes, pero el gate pide el cambio de
comportamiento completo, que excede el alcance de ese commit.

## 3. `getMyPromotions` sin límite explícito

**Contexto:** `getMyPromotions` en `src/lib/shops/queries.ts` ordena por
`created_at` pero no tiene `.limit()` ni paginación. Son las promociones de una
sola tienda (acotado por naturaleza), así que el riesgo es bajo, pero el gate
de review lo marca contra la regla de "límite explícito en cualquier query que
liste". Agregar un `.limit()` razonable cuando se toque esa función.

**Nota:** función preexistente, no modificada en el trabajo de performance.

## 4. Páginas públicas forzadas a dinámicas por el auth del layout

**Contexto:** `src/app/(public)/layout.tsx` hace `auth.getUser()` (+ perfil +
notificaciones) para renderizar el header (avatar, campana, login/perfil).
Como lee cookies, fuerza a **dinámicas todas las páginas públicas** que
envuelve: feed (`/`), tiendas (`/tienda/[slug]`), producto (`/producto/[id]`),
etc. En el build aparecen como `ƒ (Dynamic)` aunque una página declare
`export const revalidate`.

**Estado:** la página de producto (`/producto/[id]`) ya quedó lista para ISR
(no lee cookies, favoritos resueltos client-side, `revalidate = 30`), pero el
layout la sigue forzando a dinámica, así que el `revalidate` no tiene efecto
hoy.

**Decisión pendiente:** mover la auth del header público al cliente para que
las páginas públicas puedan servirse estáticas/ISR. Es un cambio transversal
(toca toda la navegación pública) con un tradeoff de UX: el header
parpadearía de estado "deslogueado" a "logueado" al hidratar. Evaluar si el
salto de rendimiento (páginas públicas cacheadas, casi instantáneas) justifica
ese parpadeo, o si conviene mitigarlo (ej. skeleton del header, o leer un
estado optimista de cookie no-httpOnly).

**Impacto potencial:** alto — el feed y las páginas de producto/tienda son las
más visitadas y las que más se benefician de ISR/caché de CDN.

## 5. Naming inconsistente snake_case / camelCase en queries de shops

**Contexto:** varias funciones de `src/lib/shops/queries.ts` devuelven un shape
mezclado. Ej. `getProductDetail` expone el producto en camelCase
(`isActive`, `videoUrl`, `parentCategoryName`) pero deja `shop.*` y
`category.*` en snake_case crudo del schema (`logo_url`, `whatsapp_number`,
`parent_id`). AGENTS.md marca justamente este caso como anti-patrón: si se
mapea a camelCase, tiene que ser una decisión centralizada y consistente,
nunca parcial.

**Estado:** preexistente, no introducido por el trabajo de performance. El gate
de review lo marca como bloqueante al tocar archivos que consumen ese shape.

**Decisión pendiente:** unificar el naming de los retornos de `queries.ts` —
o todo snake_case (más simple, alineado al schema) o un mapeo centralizado a
camelCase. Es un rename transversal que toca la query y todos sus
consumidores, así que conviene hacerlo aparte y de una.
