import { createClient } from '@/lib/supabase/server'

export async function getShopsForReview() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_admin_shops_for_review', { p_limit: 200 })
  if (error) throw error

  return (data ?? []).map((shop) => ({
    id: shop.id,
    name: shop.name,
    city: shop.city,
    whatsapp_number: shop.whatsapp_number,
    verification_status: shop.verification_status,
    created_at: shop.created_at,
    updated_at: shop.updated_at,
    is_active: shop.is_active,
    logo_url: shop.logo_url,
    activePlanName: shop.active_plan_name,
    productCount: shop.product_count ?? 0,
    openReportsCount: shop.open_reports_count ?? 0,
  }))
}

export async function searchShopsByName(query: string) {
  const trimmed = query.trim()

  if (trimmed.length < 2) return []

  const supabase = await createClient()

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name')
    .is('deleted_at', null)
    .ilike('name', `%${trimmed}%`)
    .order('name', { ascending: true })
    .limit(8)

  if (error) console.error('searchShopsByName: fallo al buscar shops', { query: trimmed, error })

  return shops ?? []
}

export async function getShopForReview(shopId: string) {
  const supabase = await createClient()

  const [
    { data: shop, error: shopError },
    { count: productCount, error: productCountError },
    { count: openReportsCount, error: reportsCountError },
  ] = await Promise.all([
    supabase
      .from('shops')
      .select(
        `
      id, name, city, whatsapp_number, email, address, verification_status,
      verification_document_url, created_at, updated_at, is_active, suspended_reason,
      logo_url, cover_url, slug, profile_views, whatsapp_clicks,
      subscriptions ( status, plan_id, subscription_plans ( name ) )
    `
      )
      .eq('id', shopId)
      .maybeSingle(),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
    supabase
      .from('shop_reports')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'pending'),
  ])

  if (shopError) console.error('getShopForReview: fallo al traer shop', { shopId, error: shopError })
  if (productCountError)
    console.error('getShopForReview: fallo al contar products', { shopId, error: productCountError })
  if (reportsCountError)
    console.error('getShopForReview: fallo al contar shop_reports', { shopId, error: reportsCountError })

  if (!shop) return null

  let documentUrl: string | null = null

  if (shop.verification_document_url) {
    const { data: signed, error: signedUrlError } = await supabase.storage
      .from('verification-docs')
      .createSignedUrl(shop.verification_document_url, 60 * 5)

    if (signedUrlError)
      console.error('getShopForReview: fallo al firmar verification-docs', { shopId, error: signedUrlError })

    documentUrl = signed?.signedUrl ?? null
  }

  const { subscriptions, ...rest } = shop
  const activeSubscription = subscriptions?.find((sub) => sub.status === 'active') ?? null

  return {
    ...rest,
    documentUrl,
    activePlanId: activeSubscription?.plan_id ?? null,
    activePlanName: activeSubscription?.subscription_plans?.name ?? null,
    productCount: productCount ?? 0,
    openReportsCount: openReportsCount ?? 0,
  }
}

export async function getPlanLimitsByPlanId(planId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plan_limits')
    .select('max_products_service, max_products_product, max_images, max_variants')
    .eq('plan_id', planId)
    .maybeSingle()

  if (error) console.error('getPlanLimitsByPlanId: fallo al traer plan_limits', { planId, error })

  return data
}

export async function getCategoriesList() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, is_active, parent_id, created_at, products(count)')
    .order('name', { ascending: true })
    .limit(200)

  if (error) console.error('getCategoriesList: fallo al traer categories', error)

  return (categories ?? []).map((category) => {
    const { products, ...rest } = category
    return { ...rest, productCount: products?.[0]?.count ?? 0 }
  })
}

export async function getCategorySuggestions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category_suggestions')
    .select(
      'id, name, status, rejection_reason, created_at, shops ( name ), parent:categories!category_suggestions_parent_id_fkey ( name )'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) console.error('getCategorySuggestions: fallo al traer category_suggestions', error)

  return data ?? []
}

export async function getCategoryById(categoryId: string) {
  const supabase = await createClient()

  const { data: category, error } = await supabase
    .from('categories')
    .select('id, name, slug, is_active, parent_id, icon_url')
    .eq('id', categoryId)
    .maybeSingle()

  if (error) console.error('getCategoryById: fallo al traer category', { categoryId, error })

  return category
}

export async function getSubscriptionRequests() {
  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      status,
      created_at,
      payment_proof_url,
      rejection_reason,
      payment_provider,
      galiopay_link_id,
      galiopay_proof_token,
      mercadopago_payment_id,
      mercadopago_reference_id,
      shops ( id, name ),
      subscription_plans ( id, name, price )
    `
    )
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) console.error('getSubscriptionRequests: fallo al traer subscriptions', error)

  return subscriptions ?? []
}

export async function getSubscriptionPlans() {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('id, name, description, price, duration_days, benefits, is_active, applies_to, created_at')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) console.error('getSubscriptionPlans: fallo al traer subscription_plans', error)

  return plans ?? []
}

export async function getSubscriptionPlanById(planId: string) {
  const supabase = await createClient()

  const [{ data: plan, error }, limits] = await Promise.all([
    supabase
      .from('subscription_plans')
      .select('id, name, description, price, duration_days, benefits, is_active, applies_to')
      .eq('id', planId)
      .maybeSingle(),
    getPlanLimitsByPlanId(planId),
  ])

  if (error) console.error('getSubscriptionPlanById: fallo al traer subscription_plans', { planId, error })

  if (!plan) return null

  return {
    ...plan,
    max_products_service: limits?.max_products_service ?? null,
    max_products_product: limits?.max_products_product ?? null,
    max_images: limits?.max_images ?? null,
    max_variants: limits?.max_variants ?? null,
  }
}

export async function getSignedPaymentProofUrl(path: string) {
  const supabase = await createClient()

  const { data: signed, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, 60 * 5)

  if (error) console.error('getSignedPaymentProofUrl: fallo al firmar payment-proofs', { path, error })

  return signed?.signedUrl ?? null
}

export async function getShopReports() {
  const supabase = await createClient()

  const { data: reports, error } = await supabase
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

  if (error) console.error('getShopReports: fallo al traer shop_reports', error)

  return reports ?? []
}

export async function getAuditLog() {
  const supabase = await createClient()

  const { data: entries, error } = await supabase
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

  if (error) console.error('getAuditLog: fallo al traer audit_log', error)

  return entries ?? []
}

export async function getUnreadNotifications() {
  const supabase = await createClient()

  const { data: notifications, error } = await supabase
    .from('admin_notifications')
    .select('id, type, reference_id, is_read, created_at')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) console.error('getUnreadNotifications: fallo al traer admin_notifications', error)

  return notifications ?? []
}

export interface PaginatedAdminNotifications {
  notifications: {
    id: string
    type: string
    reference_id: string
    is_read: boolean
    created_at: string
  }[]
  totalCount: number
  totalPages: number
}

export async function getAdminNotifications(
  page = 1,
  pageSize = 30
): Promise<PaginatedAdminNotifications> {
  const supabase = await createClient()

  const safePage = Math.max(1, page)
  const from = (safePage - 1) * pageSize
  const to = safePage * pageSize - 1

  const { data, count, error } = await supabase
    .from('admin_notifications')
    .select('id, type, reference_id, is_read, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) console.error('getAdminNotifications: fallo al paginar admin_notifications', { page, pageSize, error })

  const totalCount = count ?? 0

  return {
    notifications: data ?? [],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  }
}

export async function getUnreadNotificationsCount() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) console.error('getUnreadNotificationsCount: fallo al contar admin_notifications', error)

  return count ?? 0
}
