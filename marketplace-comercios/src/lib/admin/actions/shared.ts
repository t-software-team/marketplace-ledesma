import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'

export type ActionState = {
  error: string | null
}

export async function notifyShopOwner(
  shopId: string,
  buildEmail: (shopName: string) => { subject: string; html: string }
) {
  try {
    const service = createServiceRoleClient()
    const { data: shop } = await service
      .from('shops')
      .select('name, owner_id')
      .eq('id', shopId)
      .maybeSingle()

    if (!shop) return

    const { data: userResult } = await service.auth.admin.getUserById(shop.owner_id)
    const email = userResult?.user?.email
    if (!email) return

    const { subject, html } = buildEmail(shop.name)
    await sendEmail(email, subject, html)
  } catch (error) {
    console.error('notifyShopOwner: fallo al notificar (best effort)', { shopId, error })
  }
}

export async function notifySubscriptionOwner(
  subscriptionId: string,
  buildEmail: (shopName: string, planName: string) => { subject: string; html: string }
) {
  try {
    const service = createServiceRoleClient()
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

    const { subject, html } = buildEmail(shop.name, subscription.subscription_plans?.name ?? 'tu plan')
    await sendEmail(email, subject, html)
  } catch (error) {
    console.error('notifySubscriptionOwner: fallo al notificar (best effort)', {
      subscriptionId,
      error,
    })
  }
}

export async function logAdminAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  targetTable: string,
  targetId: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.rpc('log_admin_action', {
      p_action: action,
      p_target_table: targetTable,
      p_target_id: targetId,
      p_metadata: (metadata as never) ?? null,
    })
  } catch (error) {
    console.error('logAdminAction: fallo al registrar auditoría (best effort)', {
      action,
      targetTable,
      targetId,
      error,
    })
  }
}

export async function requireSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'superadmin') throw new Error('No autorizado')

  return { supabase, currentUserId: user.id }
}
