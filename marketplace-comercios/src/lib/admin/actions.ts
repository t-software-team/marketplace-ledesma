'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'
import {
  shopVerificationApprovedEmail,
  shopVerificationRejectedEmail,
  subscriptionApprovedEmail,
  subscriptionRejectedEmail,
} from '@/lib/email/templates'
import {
  categorySchema,
  rejectionReasonSchema,
  subscriptionPlanSchema,
} from '@/lib/validations/admin'

export type ActionState = {
  error: string | null
}

async function notifyShopOwner(
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

async function notifySubscriptionOwner(
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

async function logAdminAction(
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

export async function approveShopVerification(shopId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('approve_shop_verification', {
    p_shop_id: shopId,
  })

  if (error) {
    console.error('approveShopVerification: fallo al aprobar', { shopId, error })
    throw new Error('No pudimos aprobar la verificación')
  }

  await logAdminAction(supabase, 'shop_verified', 'shops', shopId)
  await notifyShopOwner(shopId, shopVerificationApprovedEmail)

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
}

export async function rejectShopVerification(shopId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('reject_shop_verification', {
    p_shop_id: shopId,
  })

  if (error) {
    console.error('rejectShopVerification: fallo al rechazar', { shopId, error })
    throw new Error('No pudimos rechazar la verificación')
  }

  await notifyShopOwner(shopId, shopVerificationRejectedEmail)

  await logAdminAction(supabase, 'shop_verification_rejected', 'shops', shopId)

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    parent_id: formData.get('parent_id') ?? '',
    icon_url: formData.get('icon_url') ?? '',
    is_active: formData.get('is_active') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { error } = await supabase.from('categories').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    parent_id: parsed.data.parent_id || null,
    icon_url: parsed.data.icon_url || null,
    is_active: parsed.data.is_active,
    created_by: user?.id ?? null,
  })

  if (error) {
    console.error('createCategory: fallo al crear categoría', { error })
    return {
      error:
        error.code === '23505'
          ? 'Esa URL ya está en uso, elegí otra'
          : 'No pudimos crear la categoría',
    }
  }

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias?saved=created')
}

export async function updateCategory(
  categoryId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    parent_id: formData.get('parent_id') ?? '',
    icon_url: formData.get('icon_url') ?? '',
    is_active: formData.get('is_active') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  if (parsed.data.parent_id === categoryId) {
    return { error: 'Una categoría no puede ser su propio padre' }
  }

  const { error } = await supabase
    .from('categories')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      parent_id: parsed.data.parent_id || null,
      icon_url: parsed.data.icon_url || null,
      is_active: parsed.data.is_active,
    })
    .eq('id', categoryId)

  if (error) {
    console.error('updateCategory: fallo al actualizar categoría', { categoryId, error })
    return {
      error:
        error.code === '23505'
          ? 'Esa URL ya está en uso, elegí otra'
          : 'No pudimos guardar los cambios',
    }
  }

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias?saved=updated')
}

export async function toggleCategoryActive(categoryId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)

  if (error) {
    console.error('toggleCategoryActive: fallo al actualizar categoría', { categoryId, error })
    throw new Error('No pudimos actualizar la categoría')
  }

  revalidatePath('/admin/categorias')
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

export async function createSubscriptionPlan(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = subscriptionPlanSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    duration_days: formData.get('duration_days'),
    benefits_text: formData.get('benefits_text') ?? '',
    is_active: formData.get('is_active') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  let benefits: unknown = null

  if (parsed.data.benefits_text) {
    try {
      benefits = JSON.parse(parsed.data.benefits_text)
    } catch (error) {
      console.error('subscriptionPlan: benefits_text inválido', { error })
      return { error: 'Los beneficios deben ser un JSON válido' }
    }
  }

  const { error } = await supabase.from('subscription_plans').insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: Number(parsed.data.price),
    duration_days: Number(parsed.data.duration_days),
    benefits: benefits as never,
    is_active: parsed.data.is_active,
  })

  if (error) {
    console.error('createSubscriptionPlan: fallo al crear plan', { error })
    return { error: 'No pudimos crear el plan' }
  }

  revalidatePath('/admin/subscripciones')
  redirect('/admin/subscripciones?saved=created')
}

export async function updateSubscriptionPlan(
  planId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = subscriptionPlanSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    duration_days: formData.get('duration_days'),
    benefits_text: formData.get('benefits_text') ?? '',
    is_active: formData.get('is_active') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  let benefits: unknown = null

  if (parsed.data.benefits_text) {
    try {
      benefits = JSON.parse(parsed.data.benefits_text)
    } catch (error) {
      console.error('subscriptionPlan: benefits_text inválido', { error })
      return { error: 'Los beneficios deben ser un JSON válido' }
    }
  }

  const { error } = await supabase
    .from('subscription_plans')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: Number(parsed.data.price),
      duration_days: Number(parsed.data.duration_days),
      benefits: benefits as never,
      is_active: parsed.data.is_active,
    })
    .eq('id', planId)

  if (error) {
    console.error('updateSubscriptionPlan: fallo al actualizar plan', { planId, error })
    return { error: 'No pudimos guardar los cambios' }
  }

  revalidatePath('/admin/subscripciones')
  redirect('/admin/subscripciones?saved=updated')
}

export async function toggleSubscriptionPlanActive(planId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('subscription_plans')
    .update({ is_active: isActive })
    .eq('id', planId)

  if (error) {
    console.error('toggleSubscriptionPlanActive: fallo al actualizar plan', { planId, error })
    throw new Error('No pudimos actualizar el plan')
  }

  revalidatePath('/admin/subscripciones')
}

export async function markReportReviewed(reportId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('shop_reports')
    .update({ status: 'reviewed', reviewed_by: user?.id ?? null })
    .eq('id', reportId)

  if (error) {
    console.error('markReportReviewed: fallo al actualizar reporte', { reportId, error })
    throw new Error('No pudimos actualizar el reporte')
  }

  await logAdminAction(supabase, 'report_reviewed', 'shop_reports', reportId)

  revalidatePath('/admin/reportes')
}

export async function dismissReport(reportId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('shop_reports')
    .update({ status: 'dismissed', reviewed_by: user?.id ?? null })
    .eq('id', reportId)

  if (error) {
    console.error('dismissReport: fallo al descartar reporte', { reportId, error })
    throw new Error('No pudimos descartar el reporte')
  }

  await logAdminAction(supabase, 'report_dismissed', 'shop_reports', reportId)

  revalidatePath('/admin/reportes')
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  const { error } = await supabase.rpc('mark_all_admin_notifications_read')

  if (error) {
    console.error('markAllNotificationsRead: fallo al marcar notificaciones', { error })
    throw new Error('No pudimos marcar las notificaciones como leídas')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/shops')
  revalidatePath('/admin/subscripciones')
  revalidatePath('/admin/reportes')
}
