import { getPaymentLinkStatus } from './client'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'
import { subscriptionApprovedEmail } from '@/lib/email/templates'

export async function syncGalioPaySubscription(
  subscriptionId: string,
  linkId: string,
  proofToken: string
) {
  const status = await getPaymentLinkStatus(linkId, proofToken)
  const isPaid = status.status === 'approved' || status.status === 'paid'

  if (!isPaid) {
    if (status.status === 'expired' || status.status === 'cancelled') {
      const service = createServiceRoleClient()
      const { error } = await service
        .from('subscriptions')
        .update({ status: 'expired', galiopay_status: status.status })
        .eq('id', subscriptionId)
        .eq('status', 'pending')

      if (error) {
        console.error('galiopay sync: fallo al marcar suscripción vencida', { subscriptionId, error })
      }
    }

    return { activated: false, status: status.status }
  }

  const service = createServiceRoleClient()
  const { error } = await service.rpc('approve_subscription_by_payment', {
    p_subscription_id: subscriptionId,
  })

  if (error) throw new Error('No pudimos activar la suscripción')

  await notifySubscriptionActivated(service, subscriptionId)

  return { activated: true, status: status.status }
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
    console.error('galiopay sync: fallo al notificar (best effort)', { subscriptionId, error })
  }
}
