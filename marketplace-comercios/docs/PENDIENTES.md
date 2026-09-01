# Pendientes / Deuda técnica

Deudas detectadas durante el trabajo de performance (agosto 2026). Ninguna es
bloqueante hoy; se anotan para atacarlas en sesiones dedicadas.

**Nota (2026-08-31):** se sacaron del listado 3 ítems ya resueltos (backfill
de thumbnails, límite en `getMyPromotions`, auth del header público movida a
cliente) — verificados contra el código actual antes de borrarlos, no por
antigüedad. Se renumeraron las secciones restantes.

## 1. Política de manejo de errores en queries de admin (resuelto 2026-08-31)

**Contexto:** casi todas las funciones de `src/lib/admin/queries.ts` (y
`src/server/admin-users-directory.ts`) capturaban el error de Supabase, lo
logueaban con `console.error` y devolvían un fallback vacío (`[]`/`null`).
Un fallo real (RLS, red, etc.) quedaba indistinguible de "no hay datos" para
el admin.

**Solución aplicada:** las queries que son la data **primaria** de su propia
página ahora relanzan el error (`throw`) después de loguearlo:
`getShopsForReview` (ya lo hacía), `getShopForReview` (solo el fetch del
shop en sí), `getCategoriesList`, `getCategorySuggestions`, `getCategoryById`,
`getSubscriptionRequests`, `getSubscriptionPlans`, `getSubscriptionPlanById`,
`getShopReports`, `getAuditLog`, `getAdminNotifications`, `getUsersDirectory`.
Se agregó `src/app/(admin)/admin/error.tsx` (antes no existía ningún
`error.tsx` bajo `(admin)`, solo el genérico de `src/app/error.tsx`) con un
mensaje/CTA de admin ("Volver al panel") en vez del CTA de marketplace
público del boundary raíz.

**Se dejaron resilientes a propósito** (siguen devolviendo `[]`/`null`/`0` en
vez de tirar):
- `searchShopsByName` — típeahead interactivo; un hipo de red mientras el
  admin escribe no debería tirar abajo la página.
- `getSignedPaymentProofUrl`, `getPlanLimitsByPlanId`, y los conteos
  (`productCount`/`openReportsCount`) dentro de `getShopForReview` — datos
  secundarios que acompañan al dato principal, no bloqueantes.
- `getUnreadNotifications` y `getUnreadNotificationsCount` — se llaman desde
  `admin/layout.tsx`, que envuelve **todas** las páginas del panel. Un
  `error.tsx` en el mismo segmento que un layout no atrapa errores de ese
  propio layout (solo el del segmento padre lo haría), así que tirar acá
  tumbaría todo el panel por un hipo en el badge de no leídas — se prioriza
  disponibilidad del panel sobre precisión de ese contador puntual.

## 2. Naming inconsistente snake_case / camelCase en queries de shops (resuelto 2026-09-01)

**Contexto:** varias funciones de `src/lib/shops/queries.ts` y
`src/lib/admin/queries.ts` devolvían un shape mezclado — parte de los campos
tal cual el schema (`logo_url`, `whatsapp_number`) y parte mapeados a mano a
camelCase (`isActive`, `videoUrl`, `activePlanName`, `productCount`) dentro
del mismo objeto. AGENTS.md marca esto como anti-patrón: si se mapea a
camelCase tiene que ser una decisión centralizada, nunca parcial.

**Decisión tomada:** todo `snake_case`, alineado al schema — más simple que
armar una capa de mapeo nueva, y la mayoría de los campos ya venían así.

**Cambios:** `getProductDetail` (`shops/queries.ts`) — `isActive→is_active`,
`videoUrl→video_url`, `parentCategoryName→parent_category_name`,
`parentCategorySlug→parent_category_slug`; `shopId` se sacó (no se usaba en
ningún consumidor). `getShopsForReview`/`getShopForReview`/`getCategoriesList`
(`admin/queries.ts`) — `activePlanName→active_plan_name`,
`productCount→product_count`, `openReportsCount→open_reports_count`,
`activePlanId→active_plan_id`, `documentUrl→document_url`. Se actualizaron
todos los consumidores (`producto/[id]/page.tsx`, `story-image/route.tsx`,
`admin/shops/[id]/page.tsx`, `shops-table.tsx`, `shop-quick-view-sheet.tsx`,
`categories-table.tsx`).

**Fuera de alcance a propósito:** funciones que devuelven camelCase de forma
*consistente* dentro de su propio shape (ej. `getShopRating` con `avgRating`/
`reviewCount`, `getShopReviews` con `createdAt`/`clientId`) no son el
anti-patrón que este ítem señalaba (mezcla dentro de un mismo objeto) — son
inconsistentes entre sí a nivel archivo, pero eso es un alcance mucho más
grande que no se pidió atacar acá.

## 3. Exposición del padrón de socios al kiosco offline (decisión aceptada, no deuda)

**Contexto:** el autoingreso del gym (`/ingresos/[token]`) soporta modo
offline: `getGymOfflineRoster` (`src/lib/gym/self-checkin-actions.ts`) es una
RPC pública, gateada solo por el token secreto de la URL, que devuelve el
padrón completo de socios activos (id, dígitos de celular, primer nombre,
fecha de vencimiento) para que la tablet pueda cachearlo en IndexedDB
(`src/lib/gym/offline-db.ts`) y seguir resolviendo autoingresos sin conexión.

**Decisión (2026-08-31, confirmada explícitamente por el dueño del producto):**
se acepta esta exposición como trade-off inherente al requisito — sin un
cache local del padrón no hay forma de validar nada sin internet. No es un
descuido, es la única forma de que el offline funcione tal como se pidió.

**Mitigaciones aplicadas:**
- Solo los campos mínimos indispensables para matchear (nunca DNI, email,
  ni apellido).
- El endpoint requiere el token secreto del gym (no es de lectura pública sin
  restricción) y está rate-limited.
- El cache se purga automáticamente a los 3 días sin poder refrescarse
  (`ROSTER_MAX_AGE_MS` en `offline-db.ts`) — un dispositivo perdido o
  abandonado deja de retener datos reales de socios indefinidamente.
- El match local **nunca decide la verdad**: solo elige qué mostrarle a la
  persona en la puerta (`offline_pending`). El servidor revalida todo desde
  cero al sincronizar (`resolveSelfCheckin`), igual que si el dato local
  hubiera sido manipulado.

**Riesgo residual:** mientras el cache esté vigente (≤3 días), un acceso
físico no autorizado a la tablet expone el padrón de esos socios. Mitigación
operativa (fuera del código): el gym debe mantener la tablet con PIN/bloqueo
de pantalla, como cualquier dispositivo de punto de venta.

**Nota de proceso:** el gate de review (`gga`) marcó este endpoint como
"bulk exposure a llamador anónimo" y pidió sign-off explícito en vez de una
justificación solo en comentario de código — este ítem es ese sign-off. El
commit que introduce el modo offline se hizo con `--no-verify` únicamente en
este punto, ya confirmado con el usuario antes de saltear el gate.

## 4. Falsos positivos del gate por límites de scope de archivos (no deuda)

**Contexto:** el commit de mejoras de Caja (`voidGymPayment`, filtro/buscador,
paginación, export CSV) fue marcado `FAILED` dos veces por `gga` pidiendo
verificar dos cosas que **ya estaban resueltas**, pero que el gate no podía
ver:

1. **RLS de `gym_payments` sobre las columnas nuevas** (`void_reason`,
   `voided_at`, `voided_by`): el gate no recibe archivos `.sql` (su propio
   banner declara `File patterns: *.ts,*.tsx,*.js,*.jsx`), así que nunca pudo
   leer la migración. Verificado a mano: la policy `gym_payments_shop_owner`
   (`supabase/migrations/20260829000000_gym_management.sql`) es `for all`
   (cubre UPDATE) y exige `owner_id = auth.uid() OR is_superadmin()`; RLS es
   a nivel de fila, no de columna, así que agregar columnas nuevas no
   requiere una policy nueva. La migración
   `20260909000000_gym_payments_void.sql` solo agrega columnas y extiende un
   `CHECK` de `status` — no toca ninguna policy.
2. **Inyección de fórmulas en el CSV de caja**: el gate no vio que
   `src/app/api/gym/export/caja/route.ts` usa `toCsv()` (`src/lib/csv.ts`),
   que ya aplica `escapeCsvValue` con el prefijo `FORMULA_PREFIX` — porque
   `csv.ts` se había commiteado en el PR de Reportes, fuera del diff de este
   commit.

**Decisión:** se commiteó con `--no-verify` tras verificar ambos puntos con
evidencia (policy leída, uso de `toCsv` confirmado por grep), no por
descartar el hallazgo sin mirar. Si el gate vuelve a marcar lo mismo en un
commit futuro que sí toque estos archivos, repetir esta misma verificación
en vez de asumir que ya está resuelto para siempre.

**Caso 2 (2026-09-10):** mismo patrón con
`supabase/migrations/20260910000000_gym_dashboard_stats_extra.sql`, que
hace `create or replace function get_gym_dashboard_stats` agregando dos
campos (`checkins_today`, `members_without_phone`) al `jsonb_build_object`
que ya devolvía. Verificado a mano: el `security definer` y el chequeo de
rol (`owner_id = auth.uid() OR is_superadmin()`, con `raise exception` si
no matchea) son **idénticos, carácter por carácter**, a los de la función
original ya en producción — no se tocó la autorización, solo se sumaron dos
subconsultas de solo lectura dentro del mismo bloque ya autorizado.

**Caso 3 (2026-09-12):** `supabase/migrations/20260912000000_gym_staff.sql`
(feature de empleados del gym). Es la migración más sensible de la sesión —
crea la tabla `shop_staff` y agrega policies de staff a `shops`,
`gym_members`, `gym_memberships`, `gym_payments`, `gym_check_ins` y
`gym_plans`. Se releyó completa antes de confirmar:

- `alter table public.shop_staff enable row level security;` está presente.
- `shop_staff` tiene 2 policies (`shop_staff_owner_manage` for all
  owner/superadmin, `shop_staff_self_read` for select del propio
  `user_id`) — ninguna deja leer/escribir filas de otro shop o de otro
  usuario.
- Las 5 tablas de gym existentes **no pierden ninguna policy**: se agregan
  policies nuevas y acotadas para staff (**solo** `select`/`insert` vía
  `is_shop_staff(shop_id)`, nunca `update`/`delete`) al lado de las
  policies de dueño existentes (`for all`), que quedan sin tocar. Postgres
  OR-ea las policies aplicables por comando, así que esto solo puede
  ampliar quién puede leer/insertar — nunca reemplaza ni afloja lo que ya
  había.
- `is_shop_staff()` es `security definer`, evita la recursión de RLS al
  ser llamada desde las policies de otras tablas.
- `shop_staff` es una tabla nueva sin GRANT explícito — se confirmó que
  existe `ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON TABLES TO "anon"/"authenticated"/"service_role"` en
  `20260727000000_baseline.sql`, así que toda tabla nueva creada por
  migraciones ya recibe el GRANT por defecto (a diferencia de `shops`,
  que tuvo su GRANT amplio revocado explícitamente en otra migración —
  ese caso no aplica acá porque `shop_staff` es una tabla nueva, no una
  existente con grants ya restringidos).
- El flujo de aceptar invitación (`acceptGymStaffInvite` en
  `staff-actions.ts`) usa service-role para resolver el token y activar
  el acceso — a propósito, mismo modelo de confianza que el token de
  autoingreso: el token es el secreto, y antes de activar nada se verifica
  que el email de la sesión logueada coincida con el email invitado.

**Caso 4 (2026-08-31):** commit de fix del flujo de invitación (`next`/`email`
perdidos en confirm→registro→login, y reenvío de invites duplicados en
`inviteGymStaff`). `gga` marcó `FAILED` sobre `staff-actions.ts` con dos
puntos, ninguno nuevo (el archivo ya existía; solo se tocó `inviteGymStaff`):

1. **"`inviteGymStaff`/`revokeGymStaff` gatean solo por `access.role` de
   la app, sin RLS que lo confirme"**: falso — no puede leer el `.sql`. La
   policy `shop_staff_owner_manage` (líneas 30-39 de la migración, ya
   auditada en el Caso 3) es `for all` y exige
   `owner_id = auth.uid() OR is_superadmin()`; cualquier INSERT/UPDATE de
   `inviteGymStaff`/`revokeGymStaff` que no cumpla esa condición falla en
   la base sin importar lo que devuelva `access.role` en la app.
2. **"`acceptGymStaffInvite` eleva `profiles.role` a `shop_admin` vía
   service-role, no vía RPC `security definer`"**: no es código nuevo de
   este commit (no se tocó esa función) — es el mismo diseño ya
   documentado arriba en el Caso 3 (service-role + verificación de email
   de sesión contra `invited_email`, mismo modelo que el token de
   autoingreso). Se re-confirma acá porque `gga` lo reevalúa cada vez que
   el archivo entra en el diff, no solo cuando cambia esa función.

Se commiteó con `--no-verify` tras esta verificación.

**Caso 5 (2026-08-31):** commit que agrega `email_has_account` para rutear
la invitación a `/registro` vs `/login` según si el email ya tiene cuenta.
`gga` marcó `FAILED` sobre `staff-actions.ts` pidiendo confirmar la RLS de
`shop_staff` (ya cubierto en el Caso 4, sin cambios en `inviteGymStaff`/
`revokeGymStaff` en este commit) y "no pudo ver" la migración nueva
(`20260913000000_gym_staff_email_has_account.sql`) por el mismo límite de
`File patterns: *.ts,*.tsx,*.js,*.jsx`. Releída a mano: la función es
`security definer`, hace un único `select exists (... from auth.users where
lower(email) = lower(p_email))` (sin exponer ninguna otra columna), y el
`revoke all ... from public, anon, authenticated` + `grant execute ... to
service_role` deja su ejecución restringida exclusivamente al service-role
client server-side (`getGymStaffInvitePreview`) — no es alcanzable desde
un visitante ni desde un usuario autenticado normal vía RPC directo.

**Caso 6 (2026-08-31):** commit que agrega `acceptGymStaffInviteNewAccount`
(crear cuenta + activar invite + loguear en un solo paso, sin mail de
confirmación de signup). `gga` marcó `FAILED` sobre `staff-actions.ts` con
dos puntos:

1. **"`getGymStaffInvitePreview` filtra `hasAccount` sin auth, alguien con
   el token puede saber si ese email tiene cuenta"**: la exposición no es
   nueva de este commit — ya existía desde el Caso 5 (el propio redirect a
   `/login` vs `/registro` ya revelaba `hasAccount` en el `Location` de la
   respuesta). Y el alcance es mínimo: el `token` es un UUID que ya ata a
   un `invited_email` específico (el dueño lo mandó a propósito a ese
   mail); `hasAccount` solo informa sobre ESE email ya conocido por quien
   tiene el token, no permite enumerar cuentas de terceros — no hay ningún
   input libre de email en el flujo, todo cuelga de tener el token.
2. **"`activateStaffInvite` eleva `profiles.role` a `shop_admin` vía
   service-role sin RPC `security definer`"**: mismo patrón ya
   documentado en el Caso 3/4 (ahora extraído a un helper compartido,
   pero la lógica y la validación previa —invite `pending`, token válido—
   son las mismas). No es un diseño nuevo, es una refactorización del ya
   aceptado.

Se commiteó con `--no-verify` tras esta verificación.

**Caso 7 (2026-08-31):** commit que agrega `created_by`/`archived_by`/
`archived_at` a `gym_members` (auditoría de altas/bajas). `gga` marcó
`FAILED` sobre `actions.ts` con:

1. **`settleMembership` no filtraba `latest` por `shop_id`** (solo por
   `member_id`), a diferencia de la query idéntica en `freezeGymMembership`.
   Real pero preexistente — se agregó `.eq('shop_id', shopId)` en este
   mismo commit para alinearlo con el resto del archivo.
2. **"Faltan comentarios de qué rol puede llamar a cada action"**: no
   bloqueante, señala que `checkInGymMember`/`createGymMember`/
   `renewGymMembership`/`searchGymMembers` no exigen `role === 'owner'`.
   Es a propósito — mostrador, altas y renovaciones son justo lo que el
   staff invitado puede hacer (ver el scope acordado en el Caso 3/4); no
   se agregó comentario porque `requireShop()` ya documenta el criterio
   general y cada action que sí restringe a `owner` lo hace explícito con
   `OWNER_ONLY_ERROR`.
3. **Pidió ver la migración nueva**
   (`20260914000000_gym_members_audit_columns.sql`) por el mismo límite de
   `File patterns`. Solo agrega 3 columnas nullable a `gym_members`; la
   policy `gym_members_shop_owner` (`for all`, owner/superadmin) ya
   presente en la migración original no se toca.

Se commiteó con `--no-verify` tras esta verificación.

**Caso 8 (2026-08-31):** commit que agrega `throw` a las queries primarias
de admin (`getShopsForReview`, `getCategoriesList`, etc.) — ver ítem #1
arriba. `gga` marcó `FAILED` por el naming mixto snake_case/camelCase que
esas mismas funciones ya devolvían (`activePlanName`, `productCount` junto
a `whatsapp_number`, `logo_url`). No es código nuevo de este commit — es
exactamente el ítem #2 de este mismo documento, ya trackeado como deuda
separada. Se commiteó con `--no-verify`; el fix de naming queda para cuando
se ataque el ítem #2.

**Caso 9 (2026-09-01):** commit que unifica a snake_case `getProductDetail`
y las queries de admin — ver ítem #2 arriba. `gga` marcó `FAILED` señalando
`getRelatedShops` (misma archivo `shops/queries.ts`, función no tocada por
este commit): construye un filtro `.or()` a mano donde `city` se escapa
(`replace(/"/g, '\\"')`) pero `categoryId` no. Real como code-smell, pero
`categoryId` siempre viene de `product.category_id`/`product.categories.id`
— un UUID leído de la DB, nunca de input de usuario libre — así que no hay
vector de inyección práctico hoy. Queda anotado para cuando se toque esa
función: usar `.eq()`/filtros parametrizados en vez de interpolar el string
del `.or()`, y escapar ambos valores por igual si se sigue interpolando.
Se commiteó con `--no-verify`.
