import { after } from 'next/server'
import { getPayment } from './client'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'
import { subscriptionApprovedEmail } from '@/lib/email/templates'

export async function syncMercadoPagoSubscription(paymentId: string) {
  const payment = await getPayment(paymentId)
  const service = createServiceRoleClient()

  const { data: subscription } = await service
    .from('subscriptions')
    .select('id, status')
    .eq('mercadopago_reference_id', payment.external_reference ?? '')
    .maybeSingle()

  if (!subscription) {
    return { found: false, activated: false, status: payment.status }
  }

  if (subscription.status === 'active') {
    return { found: true, activated: false, status: payment.status, alreadyActive: true }
  }

  const isPaid = payment.status === 'approved'

  if (!isPaid) {
    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      const { error } = await service
        .from('subscriptions')
        .update({ status: 'expired', mercadopago_status: payment.status, mercadopago_payment_id: paymentId })
        .eq('id', subscription.id)
        .eq('status', 'pending')

      if (error) {
        console.error('mercadopago sync: fallo al marcar suscripción vencida', {
          subscriptionId: subscription.id,
          error,
        })
      }
    } else {
      await service
        .from('subscriptions')
        .update({ mercadopago_payment_id: paymentId, mercadopago_status: payment.status })
        .eq('id', subscription.id)
    }

    return { found: true, activated: false, status: payment.status }
  }

  const { error } = await service.rpc('approve_subscription_by_payment', {
    p_subscription_id: subscription.id,
  })

  if (error) throw new Error('No pudimos activar la suscripción')

  await service
    .from('subscriptions')
    .update({ mercadopago_payment_id: paymentId, mercadopago_status: payment.status })
    .eq('id', subscription.id)

  after(() => notifySubscriptionActivated(service, subscription.id))

  return { found: true, activated: true, status: payment.status }
}

async function notifySubscriptionActivated(
  service: ReturnType<typeof createServiceRoleClient>,
  subscriptionId: string
) {
  try {
    const { data: subscription } = await service
      .from('subscriptions')
      .select('shop_id, subscription_plans ( name )')
      .eq('id', subscriptionId)
      .maybeSingle()

    if (!subscription) return

    const { data: shop } = await service
      .from('shops')
      .select('name, owner_id')
      .eq('id', subscription.shop_id)
      .maybeSingle()

    if (!shop) return

    const { data: userResult } = await service.auth.admin.getUserById(shop.owner_id)
    const email = userResult?.user?.email
    if (!email) return

    const { subject, html } = subscriptionApprovedEmail(
      shop.name,
      subscription.subscription_plans?.name ?? 'tu plan'
    )
    await sendEmail(email, subject, html)
  } catch (error) {
    console.error('mercadopago sync: fallo al notificar (best effort)', { subscriptionId, error })
  }
}
