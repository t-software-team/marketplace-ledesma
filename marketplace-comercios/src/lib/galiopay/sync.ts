import { getPaymentLinkStatus } from './client'
import { createServiceRoleClient } from '@/server/supabase-service-role'

export async function syncGalioPaySubscription(
  subscriptionId: string,
  linkId: string,
  proofToken: string
) {
  const status = await getPaymentLinkStatus(linkId, proofToken)
  const isPaid = status.status === 'approved' || status.status === 'paid'

  if (!isPaid) {
    return { activated: false, status: status.status }
  }

  const service = createServiceRoleClient()
  const { error } = await service.rpc('approve_subscription_by_payment', {
    p_subscription_id: subscriptionId,
  })

  if (error) throw new Error('No pudimos activar la suscripción')

  return { activated: true, status: status.status }
}
