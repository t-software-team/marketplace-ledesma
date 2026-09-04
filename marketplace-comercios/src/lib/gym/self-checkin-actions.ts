'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { checkRateLimit } from '@/lib/rate-limit'
import { GYM_RUBRO_SLUG } from '@/lib/category-icons'
import { argentinaDateString, argentinaStartOfDayUTC, addDaysToDate } from '@/lib/timezone'

// ---------------------------------------------------------------------------
// Owner side — enable / rotate the self check-in link
// ---------------------------------------------------------------------------

type EnsureTokenResult = { token: string | null; error: string | null }

/**
 * Resolves the current owner's gym shop id, or an error. Only gyms may enable
 * the public self check-in; the token is meaningless for any other rubro. The
 * token column itself is not read here — it is off-limits to the authenticated
 * role (see migration 20260907) and is only touched via the service role.
 */
async function requireGymShop(): Promise<{ shopId: string | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { shopId: null, error: 'No autenticado' }

  const { data: shop } = await supabase
    .from('shops')
    .select('id, categories ( slug )')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!shop) return { shopId: null, error: 'No tenés un comercio creado' }
  if (shop.categories?.slug !== GYM_RUBRO_SLUG) {
    return { shopId: null, error: 'El autoingreso es exclusivo de gimnasios' }
  }
  return { shopId: shop.id, error: null }
}

/**
 * Returns the gym's self check-in token, creating one on first use. Idempotent:
 * repeated calls return the same token until it is explicitly regenerated. The
 * token is read and written through the service role only, so it never crosses
 * the client boundary except as this action's return value.
 */
export async function ensureGymSelfCheckinToken(): Promise<EnsureTokenResult> {
  const { shopId, error } = await requireGymShop()
  if (error || !shopId) return { token: null, error: error ?? 'No autorizado' }

  const service = createServiceRoleClient()
  const { data: existing } = await service
    .from('shops')
    .select('gym_self_checkin_token')
    .eq('id', shopId)
    .maybeSingle()

  if (existing?.gym_self_checkin_token) {
    return { token: existing.gym_self_checkin_token, error: null }
  }

  const token = randomUUID()
  const { error: updateError } = await service
    .from('shops')
    .update({ gym_self_checkin_token: token })
    .eq('id', shopId)

  if (updateError) {
    console.error('ensureGymSelfCheckinToken: fallo al generar token', { shopId, error: updateError })
    return { token: null, error: 'No pudimos generar el link de autoingreso' }
  }
  return { token, error: null }
}

/**
 * Rotates the token, invalidating any previously shared self check-in URL.
 * Use when a link may have leaked.
 */
export async function regenerateGymSelfCheckinToken(): Promise<EnsureTokenResult> {
  const { shopId, error } = await requireGymShop()
  if (error || !shopId) return { token: null, error: error ?? 'No autorizado' }

  const service = createServiceRoleClient()
  const token = randomUUID()
  const { error: updateError } = await service
    .from('shops')
    .update({ gym_self_checkin_token: token })
    .eq('id', shopId)

  if (updateError) {
    console.error('regenerateGymSelfCheckinToken: fallo al rotar token', { shopId, error: updateError })
    return { token: null, error: 'No pudimos regenerar el link' }
  }
  return { token, error: null }
}

// ---------------------------------------------------------------------------
// Public side — the member self-registers by phone digits
// ---------------------------------------------------------------------------

export type SelfCheckinResult =
  | { status: 'active'; firstName: string }
  | { status: 'already'; firstName: string }
  | { status: 'expired'; firstName: string }
  | { status: 'not_found' }
  | { status: 'ambiguous' }
  | { status: 'error'; message: string }

type ResolvedGym = { id: string }

/**
 * Resolves the gym from the public self check-in token. Shared by the live
 * path and the offline sync/roster paths so token validation never drifts.
 */
async function resolveGymByToken(
  service: ReturnType<typeof createServiceRoleClient>,
  token: string
): Promise<ResolvedGym | null> {
  const { data: shop } = await service
    .from('shops')
    .select('id, deleted_at, is_active, categories ( slug )')
    .eq('gym_self_checkin_token', token)
    .maybeSingle()

  if (!shop || shop.deleted_at || !shop.is_active || shop.categories?.slug !== GYM_RUBRO_SLUG) {
    return null
  }
  return { id: shop.id }
}

/**
 * Core check-in resolution: match phone digits against the roster, decide
 * active/expired/already/not_found/ambiguous, and record the outcome. Used by
 * both the live check-in and the offline sync flush — the server always
 * re-resolves from scratch here, never trusting a client-side match, so a
 * device that matched a member while offline gets re-validated against the
 * real roster and membership state at sync time.
 *
 * `checkedInAt` lets the offline sync backdate a row to when the tap actually
 * happened (better attendance accuracy than the sync instant); the live path
 * omits it and gets "now".
 */
async function resolveSelfCheckin(
  service: ReturnType<typeof createServiceRoleClient>,
  shopId: string,
  digits: string,
  source: 'self' | 'self_offline',
  checkedInAt?: Date
): Promise<SelfCheckinResult> {
  const at = checkedInAt ?? new Date()
  const day = argentinaDateString(at)
  const dayStart = argentinaStartOfDayUTC(day).toISOString()
  const dayEnd = argentinaStartOfDayUTC(addDaysToDate(day, 1)).toISOString()

  // Match by the phone's trailing digits. Stored phones may carry formatting or
  // a country-code prefix, so compare digit-only and by suffix. `phone_digits_reversed`
  // is a generated column storing the digits reversed, so a suffix match becomes an
  // index-able prefix match (`reverse(digits)` typed so far reversed).
  const reversedDigits = digits.split('').reverse().join('')
  const { data } = await service
    .from('gym_members')
    .select('id, full_name')
    .eq('shop_id', shopId)
    .eq('is_archived', false)
    .like('phone_digits_reversed', `${reversedDigits}%`)
    .limit(5000)
  const matches = data ?? []

  // Unknown member: denied, and recorded (by the typed digits) for the audit.
  if (matches.length === 0) {
    await recordSelfDenial(service, shopId, 'denied_not_found', null, digits, source, at, dayStart, dayEnd)
    return { status: 'not_found' }
  }
  // Two members share these digits: can't self-register without guessing wrong.
  if (matches.length > 1) return { status: 'ambiguous' }

  const member = matches[0]
  const firstName = member.full_name.trim().split(/\s+/)[0] ?? member.full_name

  const { data: activePeriod } = await service
    .from('gym_memberships')
    .select('expires_at')
    .eq('member_id', member.id)
    .gte('expires_at', day)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Membership lapsed: entry denied and recorded for the owner's audit.
  if (!activePeriod) {
    await recordSelfDenial(
      service,
      shopId,
      'denied_expired',
      member.id,
      null,
      source,
      at,
      dayStart,
      dayEnd
    )
    return { status: 'expired', firstName }
  }

  // Active member. One entry per day; a repeat is a friendly warning, not a row.
  const { data: existingEntry } = await service
    .from('gym_check_ins')
    .select('id')
    .eq('shop_id', shopId)
    .eq('member_id', member.id)
    .eq('outcome', 'allowed')
    .gte('checked_in_at', dayStart)
    .lt('checked_in_at', dayEnd)
    .limit(1)
    .maybeSingle()

  if (existingEntry) {
    return { status: 'already', firstName }
  }

  const { error } = await service.from('gym_check_ins').insert({
    shop_id: shopId,
    member_id: member.id,
    outcome: 'allowed',
    source,
    created_by: null,
    checked_in_at: at.toISOString(),
  })

  if (error) {
    console.error('resolveSelfCheckin: fallo al registrar ingreso', { shopId, source, error })
    return { status: 'error', message: 'No pudimos registrar tu ingreso. Avisá en recepción.' }
  }

  return { status: 'active', firstName }
}

/**
 * Public, unauthenticated gym self check-in. The token in the URL is the only
 * access secret: it resolves the gym server-side (never trusting a client-sent
 * shop id), inserts through the service role, and returns the minimum needed to
 * confirm the entry to the person standing there — a first name only, never the
 * full name, expiry date, or any data for digits that don't match a member.
 *
 * The member is identified by their phone's trailing digits: `partial` = the
 * last 4 (fast path), `full` = the whole number, used as a tiebreaker when more
 * than one member shares those 4 digits (returns `ambiguous`).
 */
export async function gymSelfCheckin(
  token: string,
  value: string,
  mode: 'partial' | 'full' = 'partial'
): Promise<SelfCheckinResult> {
  const cleanToken = token?.trim()
  const digits = value?.replace(/\D/g, '') ?? ''

  const minLength = mode === 'full' ? 6 : 4
  if (!cleanToken || digits.length < minLength || digits.length > 15) {
    return { status: 'error', message: 'Ingresá los dígitos de tu celular.' }
  }

  // Throttle by IP to blunt DNI enumeration and check-in spam.
  const allowed = await checkRateLimit('gym_self_checkin', 20, 60)
  if (!allowed) {
    return { status: 'error', message: 'Demasiados intentos. Esperá un momento.' }
  }

  const service = createServiceRoleClient()
  const shop = await resolveGymByToken(service, cleanToken)
  if (!shop) return { status: 'error', message: 'Esta pantalla no está disponible.' }

  const result = await resolveSelfCheckin(service, shop.id, digits, 'self')
  revalidatePath('/mi-tienda/ingresos')
  return result
}

/**
 * Records a denied self check-in attempt for the owner's audit, deduplicated per
 * day so retries don't flood the log: by member for a lapsed membership, by the
 * typed digits for an unknown member.
 */
async function recordSelfDenial(
  service: ReturnType<typeof createServiceRoleClient>,
  shopId: string,
  outcome: 'denied_expired' | 'denied_not_found',
  memberId: string | null,
  attemptedRef: string | null,
  source: 'self' | 'self_offline',
  at: Date,
  dayStart: string,
  dayEnd: string
) {
  let query = service
    .from('gym_check_ins')
    .select('id')
    .eq('shop_id', shopId)
    .eq('outcome', outcome)
    .gte('checked_in_at', dayStart)
    .lt('checked_in_at', dayEnd)
    .limit(1)
  query = memberId ? query.eq('member_id', memberId) : query.eq('attempted_ref', attemptedRef ?? '')

  const { data: existing } = await query.maybeSingle()
  if (existing) return

  const { error } = await service.from('gym_check_ins').insert({
    shop_id: shopId,
    member_id: memberId,
    outcome,
    source,
    attempted_ref: attemptedRef,
    created_by: null,
    checked_in_at: at.toISOString(),
  })
  if (error) {
    console.error('recordSelfDenial: fallo al registrar intento denegado', { shopId, outcome, error })
  }
}

// ---------------------------------------------------------------------------
// Offline kiosk support — local roster cache + queued sync
// ---------------------------------------------------------------------------

export interface GymOfflineRosterEntry {
  id: string
  /** Digits only (no formatting), for local suffix matching while offline. */
  phone_digits: string
  first_name: string
  /** 'YYYY-MM-DD' of the latest membership period, or null if never had one. */
  expires_at: string | null
}

/**
 * Minimal roster for the kiosk's offline cache: just enough to reproduce the
 * live matching logic on-device (phone digits, first name, expiry) — no DNI,
 * email, or full name. This is real member data at rest on an unattended
 * tablet, so it's the operator's responsibility to keep the device locked;
 * the app only minimizes what it puts there.
 */
export async function getGymOfflineRoster(token: string): Promise<GymOfflineRosterEntry[]> {
  const cleanToken = token?.trim()
  if (!cleanToken) return []

  const allowed = await checkRateLimit('gym_offline_roster', 30, 300)
  if (!allowed) return []

  const service = createServiceRoleClient()
  const shop = await resolveGymByToken(service, cleanToken)
  if (!shop) return []

  const { data: roster, error } = await service
    .from('gym_members')
    .select('id, full_name, phone, gym_memberships ( expires_at )')
    .eq('shop_id', shop.id)
    .eq('is_archived', false)
    .not('phone', 'is', null)
    .limit(5000)

  if (error) {
    console.error('getGymOfflineRoster: fallo al traer el padrón', { shopId: shop.id, error })
    return []
  }

  return (roster ?? [])
    .filter((m) => m.phone)
    .map((m) => {
      const periods = (m.gym_memberships ?? []) as { expires_at: string }[]
      const latestExpiry = periods.reduce<string | null>(
        (latest, p) => (latest === null || p.expires_at > latest ? p.expires_at : latest),
        null
      )
      return {
        id: m.id,
        phone_digits: (m.phone ?? '').replace(/\D/g, ''),
        first_name: m.full_name.trim().split(/\s+/)[0] ?? m.full_name,
        expires_at: latestExpiry,
      }
    })
}

export interface OfflineCheckinEntry {
  /** Client-generated id so the device can drop synced entries by id. */
  clientId: string
  digits: string
  /** ISO instant of when the tap actually happened on the device. */
  checkedInAt: string
}

export type OfflineSyncOutcome = { clientId: string; result: SelfCheckinResult }

const MAX_BACKDATE_DAYS = 7

/**
 * Flushes a batch of offline-queued check-ins once the kiosk regains
 * connectivity. Each entry is re-resolved from scratch server-side — the
 * client's on-device match (done against its cached roster) is only ever a
 * guess for what to show the person at the door; it is never trusted here.
 */
export async function syncOfflineGymCheckins(
  token: string,
  entries: OfflineCheckinEntry[]
): Promise<OfflineSyncOutcome[]> {
  const cleanToken = token?.trim()
  if (!cleanToken || entries.length === 0) return []

  // Batch sync gets a higher ceiling than the live per-tap limit, capped to a
  // sane queue size so a runaway device can't use this as a bulk-insert hole.
  const allowed = await checkRateLimit('gym_offline_sync', 10, 60)
  if (!allowed) {
    return entries.map((e) => ({
      clientId: e.clientId,
      result: { status: 'error', message: 'Demasiados intentos. Esperá un momento.' },
    }))
  }

  const service = createServiceRoleClient()
  const shop = await resolveGymByToken(service, cleanToken)
  if (!shop) {
    return entries.map((e) => ({
      clientId: e.clientId,
      result: { status: 'error', message: 'Esta pantalla no está disponible.' },
    }))
  }

  const now = Date.now()
  const minAllowed = now - MAX_BACKDATE_DAYS * 24 * 60 * 60 * 1000
  const maxAllowed = now + 5 * 60 * 1000 // small clock-skew tolerance

  const outcomes: OfflineSyncOutcome[] = []
  for (const entry of entries.slice(0, 50)) {
    const digits = entry.digits?.replace(/\D/g, '') ?? ''
    const parsedAt = new Date(entry.checkedInAt)
    const atMs = parsedAt.getTime()

    if (digits.length < 4 || digits.length > 15 || Number.isNaN(atMs)) {
      outcomes.push({ clientId: entry.clientId, result: { status: 'error', message: 'Dato inválido.' } })
      continue
    }

    // Clamp instead of rejecting outright: a device offline for a long
    // weekend still deserves its check-ins recorded, just not backdated
    // indefinitely.
    const clampedAt = new Date(Math.min(Math.max(atMs, minAllowed), maxAllowed))

    const result = await resolveSelfCheckin(service, shop.id, digits, 'self_offline', clampedAt)
    outcomes.push({ clientId: entry.clientId, result })
  }

  revalidatePath('/mi-tienda/ingresos')
  return outcomes
}
