'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { checkRateLimit } from '@/lib/rate-limit'
import { GYM_RUBRO_SLUG } from '@/lib/category-icons'
import { argentinaToday, argentinaStartOfTodayUTC } from '@/lib/timezone'

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
// Public side — the member self-registers by DNI
// ---------------------------------------------------------------------------

export type SelfCheckinResult =
  | { status: 'active'; firstName: string }
  | { status: 'already'; firstName: string }
  | { status: 'expired'; firstName: string }
  | { status: 'not_found' }
  | { status: 'ambiguous' }
  | { status: 'error'; message: string }

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

  // Resolve the gym from the secret token. Must be an active, non-deleted gym.
  const { data: shop } = await service
    .from('shops')
    .select('id, deleted_at, is_active, categories ( slug )')
    .eq('gym_self_checkin_token', cleanToken)
    .maybeSingle()

  if (!shop || shop.deleted_at || !shop.is_active || shop.categories?.slug !== GYM_RUBRO_SLUG) {
    return { status: 'error', message: 'Esta pantalla no está disponible.' }
  }

  // Match by the phone's trailing digits. Stored phones may carry formatting or
  // a country-code prefix, so compare digit-only and by suffix. Filtering in JS
  // (not SQL) keeps it correct regardless of how the number was typed in.
  const { data: roster } = await service
    .from('gym_members')
    .select('id, full_name, phone')
    .eq('shop_id', shop.id)
    .eq('is_archived', false)
    .not('phone', 'is', null)
    .limit(5000)

  const matches = (roster ?? []).filter((m) => {
    const phone = (m.phone ?? '').replace(/\D/g, '')
    return phone.length >= digits.length && phone.endsWith(digits)
  })

  // Unknown member: denied, and recorded (by the typed digits) for the audit.
  if (matches.length === 0) {
    await recordSelfDenial(service, shop.id, 'denied_not_found', null, digits)
    revalidatePath('/mi-tienda/ingresos')
    return { status: 'not_found' }
  }
  // Two members share these digits: can't self-register without guessing wrong.
  // The screen will ask for the full number to disambiguate.
  if (matches.length > 1) return { status: 'ambiguous' }

  const member = matches[0]
  const firstName = member.full_name.trim().split(/\s+/)[0] ?? member.full_name
  const startOfDay = argentinaStartOfTodayUTC().toISOString()

  const { data: activePeriod } = await service
    .from('gym_memberships')
    .select('expires_at')
    .eq('member_id', member.id)
    .gte('expires_at', argentinaToday())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Membership lapsed: entry denied and recorded for the owner's audit.
  if (!activePeriod) {
    await recordSelfDenial(service, shop.id, 'denied_expired', member.id, null)
    revalidatePath('/mi-tienda/ingresos')
    return { status: 'expired', firstName }
  }

  // Active member. One entry per day; a repeat is a friendly warning, not a row.
  const { data: existingEntry } = await service
    .from('gym_check_ins')
    .select('id')
    .eq('shop_id', shop.id)
    .eq('member_id', member.id)
    .eq('outcome', 'allowed')
    .gte('checked_in_at', startOfDay)
    .limit(1)
    .maybeSingle()

  if (existingEntry) {
    return { status: 'already', firstName }
  }

  const { error } = await service.from('gym_check_ins').insert({
    shop_id: shop.id,
    member_id: member.id,
    outcome: 'allowed',
    source: 'self',
    created_by: null,
  })

  if (error) {
    console.error('gymSelfCheckin: fallo al registrar ingreso', { shopId: shop.id, error })
    return { status: 'error', message: 'No pudimos registrar tu ingreso. Avisá en recepción.' }
  }

  revalidatePath('/mi-tienda/ingresos')
  return { status: 'active', firstName }
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
  attemptedRef: string | null
) {
  const startOfDay = argentinaStartOfTodayUTC().toISOString()
  let query = service
    .from('gym_check_ins')
    .select('id')
    .eq('shop_id', shopId)
    .eq('outcome', outcome)
    .gte('checked_in_at', startOfDay)
    .limit(1)
  query = memberId ? query.eq('member_id', memberId) : query.eq('attempted_ref', attemptedRef ?? '')

  const { data: existing } = await query.maybeSingle()
  if (existing) return

  const { error } = await service.from('gym_check_ins').insert({
    shop_id: shopId,
    member_id: memberId,
    outcome,
    source: 'self',
    attempted_ref: attemptedRef,
    created_by: null,
  })
  if (error) {
    console.error('recordSelfDenial: fallo al registrar intento denegado', { shopId, outcome, error })
  }
}
