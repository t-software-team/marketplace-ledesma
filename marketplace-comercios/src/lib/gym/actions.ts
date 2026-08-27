'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gymMemberSchema, gymPlanSchema, gymRenewalSchema } from '@/lib/validations/gym'

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

/** start + duration_days, both as YYYY-MM-DD strings. */
function computeExpiry(durationDays: number): { start: string; expires: string } {
  const start = new Date()
  const expires = new Date()
  expires.setDate(expires.getDate() + durationDays)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { start: iso(start), expires: iso(expires) }
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

  if (error) return { error: 'No pudimos actualizar el plan' }
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

  if (error) return { error: 'No pudimos borrar el plan' }
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

  if (error) return { error: 'No pudimos actualizar al socio' }
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

  const { start, expires } = computeExpiry(plan.duration_days)

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
