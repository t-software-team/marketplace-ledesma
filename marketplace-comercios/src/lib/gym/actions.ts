'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  gymMemberSchema,
  gymMemberUpdateSchema,
  gymPlanSchema,
  gymRenewalSchema,
} from '@/lib/validations/gym'
import { getGymMembers, getTodayCheckIns, type GymMemberSearchResult } from '@/lib/gym/queries'
import { getGymBenefits, getGymMemberLimitInfo } from '@/lib/shops/queries'
import { addDaysToDate, argentinaToday } from '@/lib/timezone'

export type ActionState = {
  error: string | null
  warning?: string | null
  fieldErrors?: Record<string, string>
}

function buildFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

async function requireShop() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return { supabase, user, shopId: shop?.id ?? null }
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
export async function createGymPlan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const parsed = gymPlanSchema.safeParse({
    name: formData.get('name'),
    kind: formData.get('kind'),
    duration_days: formData.get('duration_days'),
    price: formData.get('price') ?? '0',
    is_active: formData.get('is_active') !== 'off',
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const { error } = await supabase.from('gym_plans').insert({
    shop_id: shopId,
    name: parsed.data.name,
    kind: parsed.data.kind,
    duration_days: parsed.data.duration_days,
    price: parsed.data.price,
    is_active: parsed.data.is_active,
  })

  if (error) {
    console.error('createGymPlan: fallo al crear plan', { shopId, error })
    return { error: 'No pudimos crear el plan' }
  }

  revalidatePath('/mi-tienda/planes')
  return { error: null }
}

export async function setGymPlanActive(planId: string, isActive: boolean): Promise<ActionState> {
  const { supabase, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const { error } = await supabase
    .from('gym_plans')
    .update({ is_active: isActive })
    .eq('id', planId)
    .eq('shop_id', shopId)

  if (error) {
    console.error('setGymPlanActive: fallo al actualizar plan', { planId, isActive, error })
    return { error: 'No pudimos actualizar el plan' }
  }
  revalidatePath('/mi-tienda/planes')
  return { error: null }
}

export async function deleteGymPlan(planId: string): Promise<ActionState> {
  const { supabase, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const { error } = await supabase
    .from('gym_plans')
    .delete()
    .eq('id', planId)
    .eq('shop_id', shopId)

  if (error) {
    console.error('deleteGymPlan: fallo al borrar plan', { planId, error })
    return { error: 'No pudimos borrar el plan' }
  }
  revalidatePath('/mi-tienda/planes')
  return { error: null }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function createGymMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const limitInfo = await getGymMemberLimitInfo(shopId)
  if (limitInfo.reached) {
    return {
      error: `Llegaste al límite de ${limitInfo.max} socios de tu plan. Mejorá al Plan Gimnasio para sumar socios sin tope.`,
    }
  }

  const parsed = gymMemberSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    document: formData.get('document') ?? '',
    notes: formData.get('notes') ?? '',
    plan_id: formData.get('plan_id') ?? '',
    payment_method: formData.get('payment_method') || undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const { data: member, error } = await supabase
    .from('gym_members')
    .insert({
      shop_id: shopId,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      document: parsed.data.document || null,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (error || !member) {
    console.error('createGymMember: fallo al crear socio', { shopId, error })
    return { error: 'No pudimos dar de alta al socio' }
  }

  // Optional membership + payment on alta.
  if (parsed.data.plan_id) {
    if (!parsed.data.payment_method) {
      return {
        error: 'El socio se creó, pero elegí el método de pago para registrar la membresía',
        fieldErrors: { payment_method: 'Elegí efectivo o transferencia' },
      }
    }
    const settle = await settleMembership(
      supabase,
      shopId,
      member.id,
      parsed.data.plan_id,
      parsed.data.payment_method,
      user.id
    )
    if (settle) return { error: settle }
  }

  revalidatePath('/mi-tienda/socios')
  revalidatePath('/mi-tienda')
  return { error: null }
}

export async function renewGymMembership(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const parsed = gymRenewalSchema.safeParse({
    member_id: formData.get('member_id'),
    plan_id: formData.get('plan_id'),
    payment_method: formData.get('payment_method'),
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const settle = await settleMembership(
    supabase,
    shopId,
    parsed.data.member_id,
    parsed.data.plan_id,
    parsed.data.payment_method,
    user.id
  )
  if (settle) return { error: settle }

  revalidatePath('/mi-tienda/socios')
  revalidatePath('/mi-tienda/caja')
  revalidatePath('/mi-tienda')
  return { error: null }
}

export async function setGymMemberArchived(
  memberId: string,
  archived: boolean
): Promise<ActionState> {
  const { supabase, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const { error } = await supabase
    .from('gym_members')
    .update({ is_archived: archived })
    .eq('id', memberId)
    .eq('shop_id', shopId)

  if (error) {
    console.error('setGymMemberArchived: fallo al actualizar socio', { memberId, archived, error })
    return { error: 'No pudimos actualizar al socio' }
  }
  revalidatePath('/mi-tienda/socios')
  revalidatePath('/mi-tienda')
  return { error: null }
}

export async function updateGymMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const parsed = gymMemberUpdateSchema.safeParse({
    member_id: formData.get('member_id'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    document: formData.get('document') ?? '',
    notes: formData.get('notes') ?? '',
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const { error } = await supabase
    .from('gym_members')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      document: parsed.data.document || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', parsed.data.member_id)
    .eq('shop_id', shopId)

  if (error) {
    console.error('updateGymMember: fallo al actualizar socio', { error })
    return { error: 'No pudimos guardar los cambios' }
  }

  revalidatePath('/mi-tienda/socios')
  revalidatePath(`/mi-tienda/socios/${parsed.data.member_id}`)
  return { error: null }
}

export type CheckInResult = {
  error: string | null
  member_name?: string
  status?: 'active' | 'expired'
  expires_at?: string | null
}

/**
 * Records a gym entry. Always logs the check-in, but reports whether the
 * member's membership is currently valid so the desk can act on a lapsed one.
 */
export async function checkInGymMember(memberId: string): Promise<CheckInResult> {
  const { supabase, user, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const { data: member } = await supabase
    .from('gym_members')
    .select('id, full_name')
    .eq('id', memberId)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (!member) return { error: 'No encontramos al socio' }

  const today = argentinaToday()
  const { data: activePeriod } = await supabase
    .from('gym_memberships')
    .select('expires_at')
    .eq('member_id', memberId)
    .gte('expires_at', today)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('gym_check_ins').insert({
    shop_id: shopId,
    member_id: memberId,
    created_by: user.id,
  })

  if (error) {
    console.error('checkInGymMember: fallo al registrar ingreso', { memberId, error })
    return { error: 'No pudimos registrar el ingreso' }
  }

  revalidatePath('/mi-tienda/ingresos')
  return {
    error: null,
    member_name: member.full_name,
    status: activePeriod ? 'active' : 'expired',
    expires_at: activePeriod?.expires_at ?? null,
  }
}

/**
 * Server-side member lookup for the check-in desk. Returns only the matches
 * (capped) instead of shipping the whole roster to the client.
 */
export async function searchGymMembers(query: string): Promise<GymMemberSearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const { shopId } = await requireShop()
  if (!shopId) return []

  const [members, todayCheckIns] = await Promise.all([
    getGymMembers(shopId, { search: q, limit: 8 }),
    getTodayCheckIns(shopId, 100),
  ])

  const alreadyCheckedIn = new Set(todayCheckIns.map((c) => c.member_id))
  const filtered = members.filter((m) => !alreadyCheckedIn.has(m.id))

  return filtered.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    document: m.document,
    phone: m.phone,
    status: m.status,
    expires_at: m.expires_at,
  }))
}

/**
 * Congela (pausa) la membresía vigente de un socio extendiendo su vencimiento
 * `days` días. Feature premium del Plan Gimnasio (benefit gym_freeze).
 */
export async function freezeGymMembership(
  memberId: string,
  days: number
): Promise<ActionState> {
  const { supabase, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const benefits = await getGymBenefits(shopId)
  if (!benefits.freeze) {
    return { error: 'Congelar membresías es una función del Plan Gimnasio.' }
  }

  if (!Number.isInteger(days) || days < 1 || days > 180) {
    return { error: 'Ingresá una cantidad de días entre 1 y 180.' }
  }

  const { data: latest } = await supabase
    .from('gym_memberships')
    .select('id, expires_at')
    .eq('member_id', memberId)
    .eq('shop_id', shopId)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latest) return { error: 'El socio no tiene una membresía para congelar.' }
  if (latest.expires_at < argentinaToday()) {
    return { error: 'No se puede congelar una membresía vencida. Renovala primero.' }
  }

  const { error } = await supabase
    .from('gym_memberships')
    .update({ expires_at: addDaysToDate(latest.expires_at, days) })
    .eq('id', latest.id)
    .eq('shop_id', shopId)

  if (error) {
    console.error('freezeGymMembership: fallo al congelar', { memberId, days, error })
    return { error: 'No pudimos congelar la membresía' }
  }

  revalidatePath(`/mi-tienda/socios/${memberId}`)
  revalidatePath('/mi-tienda/socios')
  revalidatePath('/mi-tienda')
  return { error: null }
}

/**
 * Creates a membership period for `planId` and its matching desk payment.
 * Returns an error string on failure, or null on success.
 */
async function settleMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  memberId: string,
  planId: string,
  method: 'cash' | 'transfer',
  userId: string
): Promise<string | null> {
  const { data: plan } = await supabase
    .from('gym_plans')
    .select('id, duration_days, price')
    .eq('id', planId)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (!plan) return 'El plan elegido no existe'

  // Renovación que suma: si el socio sigue vigente, el nuevo período arranca
  // desde su vencimiento actual (no pierde los días que le quedan). Si venció
  // o es nuevo, arranca hoy.
  const today = argentinaToday()
  const { data: latest } = await supabase
    .from('gym_memberships')
    .select('expires_at')
    .eq('member_id', memberId)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const start = latest && latest.expires_at >= today ? latest.expires_at : today
  const expires = addDaysToDate(start, plan.duration_days)

  const { data: membership, error: membershipError } = await supabase
    .from('gym_memberships')
    .insert({
      shop_id: shopId,
      member_id: memberId,
      plan_id: plan.id,
      start_date: start,
      expires_at: expires,
      price: plan.price,
      created_by: userId,
    })
    .select('id')
    .single()

  if (membershipError || !membership) {
    console.error('settleMembership: fallo al crear membresía', { memberId, error: membershipError })
    return 'No pudimos registrar la membresía'
  }

  const { error: paymentError } = await supabase.from('gym_payments').insert({
    shop_id: shopId,
    membership_id: membership.id,
    amount: plan.price,
    method,
    status: 'paid',
    paid_at: new Date().toISOString(),
    created_by: userId,
  })

  if (paymentError) {
    console.error('settleMembership: fallo al registrar pago', { memberId, error: paymentError })
    return 'La membresía se creó, pero no pudimos registrar el pago'
  }

  return null
}

/**
 * Corrects a mis-entered payment without deleting it: marks it 'voided' with
 * a reason, so caja stays auditable and the amount stops counting toward
 * revenue (get_gym_dashboard_stats already filters status='paid').
 */
export async function voidGymPayment(
  paymentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user, shopId } = await requireShop()
  if (!shopId) return { error: 'No tenés un comercio creado' }

  const trimmedReason = String(formData.get('reason') ?? '').trim()
  if (!trimmedReason) return { error: 'Ingresá un motivo para anular el pago' }

  const { data: payment } = await supabase
    .from('gym_payments')
    .select('id, status')
    .eq('id', paymentId)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (!payment) return { error: 'No encontramos el pago' }
  if (payment.status === 'voided') return { error: 'Este pago ya está anulado' }

  const { error } = await supabase
    .from('gym_payments')
    .update({
      status: 'voided',
      void_reason: trimmedReason,
      voided_at: new Date().toISOString(),
      voided_by: user.id,
    })
    .eq('id', paymentId)
    .eq('shop_id', shopId)

  if (error) {
    console.error('voidGymPayment: fallo al anular el pago', { paymentId, error })
    return { error: 'No pudimos anular el pago' }
  }

  revalidatePath('/mi-tienda/caja')
  revalidatePath('/mi-tienda')
  return { error: null }
}
