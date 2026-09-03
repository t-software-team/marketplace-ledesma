'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { syncGalioPaySubscription } from '@/lib/galiopay/sync'
import { syncMercadoPagoSubscriptionByReference } from '@/lib/mercadopago/sync'
import { subscriptionApprovedEmail, subscriptionRejectedEmail } from '@/lib/email/templates'
import { rejectionReasonSchema } from '@/lib/validations/admin'
import { logAdminAction, notifySubscriptionOwner, type ActionState } from './shared'

export async function checkGalioPaySubscription(
  subscriptionId: string,
  linkId: string,
  proofToken: string
) {
  try {
    const result = await syncGalioPaySubscription(subscriptionId, linkId, proofToken)
    revalidatePath('/admin/subscripciones')
    return { activated: result.activated, status: result.status }
  } catch (error) {
    console.error('checkGalioPaySubscription: fallo al verificar con GalioPay', {
      subscriptionId,
      error,
    })
    throw new Error('No pudimos consultar el estado del pago con GalioPay')
  }
}

export async function checkMercadoPagoSubscription(referenceId: string) {
  try {
    const result = await syncMercadoPagoSubscriptionByReference(referenceId)
    revalidatePath('/admin/subscripciones')
    return { activated: result.activated, status: result.status }
  } catch (error) {
    console.error('checkMercadoPagoSubscription: fallo al verificar con Mercado Pago', {
      referenceId,
      error,
    })
    throw new Error('No pudimos consultar el estado del pago con Mercado Pago')
  }
}

export async function approveSubscriptionRequest(subscriptionId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('approve_subscription', {
    p_subscription_id: subscriptionId,
  })

  if (error) {
    console.error('approveSubscriptionRequest: fallo al aprobar', { subscriptionId, error })
    throw new Error('No pudimos aprobar la suscripción')
  }

  await logAdminAction(supabase, 'subscription_approved', 'subscriptions', subscriptionId)
  await notifySubscriptionOwner(subscriptionId, subscriptionApprovedEmail)

  revalidatePath('/admin/subscripciones')
}

export async function rejectSubscriptionRequest(
  subscriptionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = rejectionReasonSchema.safeParse({
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { error } = await supabase.rpc('reject_subscription', {
    p_subscription_id: subscriptionId,
    p_reason: parsed.data.reason,
  })

  if (error) {
    console.error('rejectSubscriptionRequest: fallo al rechazar', { subscriptionId, error })
    return { error: 'No pudimos rechazar la suscripción' }
  }

  await logAdminAction(supabase, 'subscription_rejected', 'subscriptions', subscriptionId, {
    reason: parsed.data.reason,
  })
  await notifySubscriptionOwner(subscriptionId, (shopName) =>
    subscriptionRejectedEmail(shopName, parsed.data.reason)
  )

  revalidatePath('/admin/subscripciones')
  return { error: null }
}
