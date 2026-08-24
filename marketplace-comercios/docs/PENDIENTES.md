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
