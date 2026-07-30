import { createClient } from '@/lib/supabase/server'

export async function getShopsForReview() {
  const supabase = await createClient()

  const { data: shops } = await supabase
    .from('shops')
    .select(
      `
      id, name, city, whatsapp_number, verification_status, created_at, is_active,
      subscriptions ( status, subscription_plans ( name ) )
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200)

  return (shops ?? []).map((shop) => {
    const { subscriptions, ...rest } = shop
    const activePlanName =
      subscriptions?.find((sub) => sub.status === 'active')?.subscription_plans?.name ?? null
    return { ...rest, activePlanName }
  })
}

export async function getShopForReview(shopId: string) {
  const supabase = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select(
      `
      id, name, city, whatsapp_number, email, address, verification_status,
      verification_document_url, created_at, is_active, suspended_reason,
      subscriptions ( status, plan_id, subscription_plans ( name ) )
    `
    )
    .eq('id', shopId)
    .maybeSingle()

  if (!shop) return null

  let documentUrl: string | null = null

  if (shop.verification_document_url) {
    const { data: signed } = await supabase.storage
      .from('verification-docs')
      .createSignedUrl(shop.verification_document_url, 60 * 5)

    documentUrl = signed?.signedUrl ?? null
  }

  const { subscriptions, ...rest } = shop
  const activeSubscription = subscriptions?.find((sub) => sub.status === 'active') ?? null

  return {
    ...rest,
    documentUrl,
    activePlanId: activeSubscription?.plan_id ?? null,
    activePlanName: activeSubscription?.subscription_plans?.name ?? null,
  }
}

export async function getCategoriesList() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, is_active, parent_id, created_at')
    .order('name', { ascending: true })
    .limit(200)

  return categories ?? []
}

export async function getCategorySuggestions() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('category_suggestions')
    .select(
      'id, name, status, rejection_reason, created_at, shops ( name ), parent:categories!category_suggestions_parent_id_fkey ( name )'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  return data ?? []
}

export async function getCategoryById(categoryId: string) {
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, is_active, parent_id, icon_url')
    .eq('id', categoryId)
    .maybeSingle()

  return category
}

export async function getSubscriptionRequests() {
  const supabase = await createClient()

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      status,
      created_at,
      payment_proof_url,
      rejection_reason,
      galiopay_link_id,
      galiopay_proof_token,
      shops ( id, name ),
      subscription_plans ( id, name, price )
    `
    )
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  return subscriptions ?? []
}

export async function getSubscriptionPlans() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('id, name, description, price, duration_days, benefits, is_active, applies_to, created_at')
    .order('created_at', { ascending: true })
    .limit(200)

  return plans ?? []
}

export async function getSubscriptionPlanById(planId: string) {
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id, name, description, price, duration_days, benefits, is_active, applies_to')
    .eq('id', planId)
    .maybeSingle()

  return plan
}

export async function getSignedPaymentProofUrl(path: string) {
  const supabase = await createClient()

  const { data: signed } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, 60 * 5)

  return signed?.signedUrl ?? null
}

export async function getShopReports() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('shop_reports')
    .select(
      `
      id,
      reason,
      comment,
      status,
      created_at,
      shops ( id, name ),
      reported_by_profile:profiles!shop_reports_reported_by_fkey ( full_name )
    `
    )
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  return reports ?? []
}

export async function getAuditLog() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('audit_log')
    .select(
      `
      id,
      action,
      target_table,
      target_id,
      metadata,
      created_at,
      actor:profiles!audit_log_actor_id_fkey ( full_name )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  return entries ?? []
}

export async function getUnreadNotifications() {
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from('admin_notifications')
    .select('id, type, reference_id, is_read, created_at')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  return notifications ?? []
}

export async function getUnreadNotificationsCount() {
  const supabase = await createClient()

  const { count } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  return count ?? 0
}
