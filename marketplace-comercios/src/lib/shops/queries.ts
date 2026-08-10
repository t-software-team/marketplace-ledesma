import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'

export async function getMyShop() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: shop } = await supabase
    .from('shops')
    .select(
      `
      id, owner_id, category_id, name, slug, description, logo_url, cover_url,
      whatsapp_number, email, instagram_url, facebook_url, website_url, address, city,
      verification_status, verification_document_url, verified_by, verified_at,
      subscription_status, subscription_expires_at,
      is_active, is_paused, paused_reason, business_hours, accent_color,
      landing_banner, landing_services, landing_gallery, landing_video_url,
      profile_views, whatsapp_clicks, created_at, updated_at, deleted_at,
      categories ( slug )
    `
    )
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return shop
}

export async function getShopContactsSeries(shopId: string, days = 14) {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('shop_contacts')
    .select('created_at')
    .eq('shop_id', shopId)
    .gte('created_at', since.toISOString())

  const counts = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const date = new Date(since)
    date.setDate(date.getDate() + i)
    counts.set(date.toISOString().slice(0, 10), 0)
  }

  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([date, count]) => ({
    date: new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(new Date(date)),
    contactos: count,
  }))
}

export async function getMyPromotions(shopId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_promotions')
    .select(
      'id, image_url, text, created_at, expires_at, text_position, text_size, text_color, bg_color, products ( id, name )'
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data
}

export const getActivePromotions = unstable_cache(
  async () => {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('shop_promotions')
      .select(
        `
        id, image_url, text, expires_at, text_position, text_size, text_color, bg_color,
        shops ( id, name, slug, logo_url, whatsapp_number, verification_status, subscription_status ),
        products ( id, name )
      `
      )
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !data) return []

    return data.filter((promo) => promo.shops !== null)
  },
  ['active-promotions'],
  { revalidate: 30 }
)

export interface MyShopProductsResult {
  products: {
    id: string
    name: string
    price: number | null
    currency: string
    is_active: boolean
    is_featured: boolean
    mainImage: string | null
    imageUrls: string[]
    categoryName: string | null
  }[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getMyShopProducts(
  shopId: string,
  page = 1,
  pageSize = 24,
  search?: string
): Promise<MyShopProductsResult> {
  const supabase = await createClient()

  const safePage = Math.max(1, page)
  const from = (safePage - 1) * pageSize
  const to = safePage * pageSize - 1
  const normalizedSearch = search?.trim()

  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      price,
      currency,
      is_active,
      is_featured,
      product_images ( id, url, sort_order ),
      categories ( name )
    `,
      { count: 'exact' }
    )
    .eq('shop_id', shopId)

  if (normalizedSearch) {
    query = query.ilike('name', `%${normalizedSearch}%`)
  }

  const { data: products, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !products) {
    return { products: [], totalCount: 0, page: safePage, pageSize, totalPages: 1 }
  }

  const totalCount = count ?? products.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const mapped = products.map((product) => {
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      is_active: product.is_active,
      is_featured: product.is_featured,
      mainImage: images[0]?.url ?? null,
      imageUrls: images.map((image) => image.url),
      categoryName: product.categories?.name ?? null,
    }
  })

  return { products: mapped, totalCount, page: safePage, pageSize, totalPages }
}

export async function getActiveCategories() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, is_service')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('name', { ascending: true })
    .limit(100)

  return categories ?? []
}

export async function getCategoryAttributes(categoryId: string | null) {
  if (!categoryId) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('category_attributes')
    .select('id, key, label, type, options')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })

  return data ?? []
}

export async function getProductAttributeValues(productId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('product_attribute_values')
    .select('attribute_id, value, category_attributes ( key, label, type )')
    .eq('product_id', productId)

  return data ?? []
}

export async function getSubcategories(parentId: string | null) {
  if (!parentId) return []

  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .eq('parent_id', parentId)
    .order('name', { ascending: true })
    .limit(100)

  return categories ?? []
}

export async function getMyProduct(productId: string) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(
      `
      id,
      shop_id,
      name,
      description,
      price,
      currency,
      category_id,
      is_active,
      video_url,
      product_images ( id, url, sort_order ),
      product_variants ( id, name, price, sort_order )
    `
    )
    .eq('id', productId)
    .maybeSingle()

  return product
}

export const getShopBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient()

    const { data: shop, error } = await supabase
      .from('shops')
      .select(
        `
        id,
        name,
        slug,
        description,
        logo_url,
        cover_url,
        whatsapp_number,
        instagram_url,
        facebook_url,
        website_url,
        address,
        city,
        category_id,
        verification_status,
        subscription_status,
        is_paused,
        paused_reason,
        accent_color,
        landing_banner,
        landing_services,
        landing_gallery,
        landing_video_url,
        business_hours,
        categories ( name, is_service )
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle()

    if (error || !shop) return null

    return shop
  },
  ['shop-by-slug'],
  { revalidate: 30 }
)

export const getRelatedShops = unstable_cache(
  async (shopId: string, categoryId: string | null, city: string | null, limit = 8) => {
    if (!categoryId && !city) return []

    const supabase = createPublicClient()

    const filters = [
      categoryId ? `category_id.eq.${categoryId}` : null,
      city ? `city.eq."${city.replace(/"/g, '\\"')}"` : null,
    ].filter(Boolean)

    const { data } = await supabase
      .from('shops')
      .select('id, name, slug, logo_url, city, verification_status, subscription_status')
      .neq('id', shopId)
      .eq('is_active', true)
      .eq('is_paused', false)
      .is('deleted_at', null)
      .or(filters.join(','))
      .order('subscription_status', { ascending: false })
      .order('verification_status', { ascending: false })
      .limit(limit)

    return data ?? []
  },
  ['related-shops'],
  { revalidate: 60 }
)

export async function getShopRating(shopId: string) {
  const supabase = await createClient()

  const { data } = await supabase.rpc('get_shop_rating', { p_shop_id: shopId })
  const row = data?.[0]

  return {
    avgRating: row?.avg_rating ? Number(row.avg_rating) : 0,
    reviewCount: row?.review_count ? Number(row.review_count) : 0,
  }
}

export async function getShopReviews(shopId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_shop_reviews', { p_shop_id: shopId })

  if (error || !data) return []

  return data.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
    clientId: review.client_id,
    clientName: review.client_name,
  }))
}

export async function getMyShopReview(shopId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('shop_reviews')
    .select('id, rating, comment')
    .eq('shop_id', shopId)
    .eq('client_id', user.id)
    .maybeSingle()

  return data
}

export async function getShopFollowStats(shopId: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_shop_follow_stats', { p_shop_id: shopId })
  return data?.[0]?.follower_count ? Number(data[0].follower_count) : 0
}

export async function getMyShopFollow(shopId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from('shop_follows')
    .select('id')
    .eq('shop_id', shopId)
    .eq('client_id', user.id)
    .maybeSingle()

  return Boolean(data)
}

export async function getMyFollowedShops() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('shop_follows')
    .select(
      `
      created_at,
      shops (
        id, name, slug, logo_url, city,
        verification_status, subscription_status,
        categories ( name )
      )
    `
    )
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []

  return data
    .map((row) => row.shops)
    .filter((shop): shop is NonNullable<typeof shop> => shop !== null)
}

export async function getMyContactHistory() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('shop_contacts')
    .select(
      `
      id, created_at,
      shops ( id, name, slug, logo_url ),
      products ( id, name )
    `
    )
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) return []

  const seenShopIds = new Set<string>()
  const deduped = []

  for (const row of data) {
    if (!row.shops) continue
    if (seenShopIds.has(row.shops.id)) continue
    seenShopIds.add(row.shops.id)
    deduped.push(row)
  }

  return deduped
}

export async function getActiveSubscriptionPlans() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('id, name, description, price, duration_days, benefits, applies_to')
    .eq('is_active', true)
    .order('price', { ascending: true })
    .limit(50)

  return plans ?? []
}

export async function getMyActiveSubscription(shopId: string) {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, plan_id, end_date, subscription_plans ( name, benefits )')
    .eq('shop_id', shopId)
    .eq('status', 'active')
    .order('approved_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return subscription
}

export async function getMyPendingSubscription(shopId: string) {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      'id, status, created_at, galiopay_link_id, galiopay_proof_token, galiopay_checkout_url, subscription_plans ( id, name )'
    )
    .eq('shop_id', shopId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return subscription
}

export const getProductDetail = unstable_cache(
  async (productId: string) => {
    const supabase = createPublicClient()

    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        id,
        shop_id,
        name,
        description,
        price,
        currency,
        is_active,
        category_id,
        video_url,
        categories ( id, name, slug, parent_id ),
        product_images ( id, url, sort_order ),
        product_variants ( id, name, price, sort_order ),
        product_attribute_values ( value, category_attributes ( key, label, type ) ),
        shops ( id, name, slug, whatsapp_number, verification_status, subscription_status, logo_url )
      `
      )
      .eq('id', productId)
      .maybeSingle()

    if (error || !product) return null

    let parentCategoryName: string | null = null
    let parentCategorySlug: string | null = null
    if (product.categories?.parent_id) {
      const { data: parentCategory } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('id', product.categories.parent_id)
        .maybeSingle()

      parentCategoryName = parentCategory?.name ?? null
      parentCategorySlug = parentCategory?.slug ?? null
    }

    const images = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )
    const variants = [...(product.product_variants ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )

    const attributesByLabel = new Map<string, { type: string; values: string[] }>()
    for (const row of product.product_attribute_values ?? []) {
      const label = row.category_attributes?.label
      if (!label) continue
      const group = attributesByLabel.get(label) ?? { type: row.category_attributes?.type ?? 'text', values: [] }
      group.values.push(row.value)
      attributesByLabel.set(label, group)
    }
    const attributes = Array.from(attributesByLabel, ([label, group]) => ({
      label,
      type: group.type,
      values: group.values,
    }))

    return {
      id: product.id,
      shopId: product.shop_id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      isActive: product.is_active,
      category: product.categories,
      parentCategoryName,
      parentCategorySlug,
      videoUrl: product.video_url,
      images,
      variants,
      attributes,
      shop: product.shops,
    }
  },
  ['product-detail'],
  { revalidate: 30 }
)

export const getFeedData = unstable_cache(
  async (limit: number, offset: number) => {
    const supabase = createPublicClient()

    const [{ data: categories }, { data: subcategories }, { data: products }] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('name'),
      supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .not('parent_id', 'is', null)
        .order('name'),
      supabase.rpc('get_products_feed', { p_limit: limit, p_offset: offset }),
    ])

    return {
      categories: categories ?? [],
      subcategories: subcategories ?? [],
      products: products ?? [],
    }
  },
  ['feed-data'],
  { revalidate: 30 }
)

export async function getMyFavorites() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: favorites, error } = await supabase
    .from('favorites')
    .select(
      `
      created_at,
      products (
        id,
        name,
        price,
        currency,
        shop_id,
        is_active,
        product_images ( url, sort_order ),
        shops ( id, name, is_featured:subscription_status, is_active )
      )
    `
    )
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !favorites) return []

  return favorites
    .map((favorite) => favorite.products)
    .filter(
      (product): product is NonNullable<typeof product> =>
        product != null && product.is_active === true && product.shops?.is_active === true
    )
    .map((product) => {
      const images = [...(product.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      )

      return {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        shop_id: product.shop_id,
        shop_name: product.shops?.name ?? '',
        shop_is_featured: product.shops?.is_featured === 'active',
        distance_km: null,
        main_image: images[0]?.url ?? null,
      }
    })
}

export const SHOP_PRODUCTS_PAGE_SIZE = 24

export async function getShopProducts(shopId: string, limit = SHOP_PRODUCTS_PAGE_SIZE, offset = 0) {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      price,
      currency,
      product_images ( url, sort_order )
    `
    )
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !products) return []

  return products.map((product) => {
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      mainImage: images[0]?.url ?? null,
    }
  })
}

const FREE_PLAN_MAX_PRODUCTS_SERVICE = 3
const FREE_PLAN_MAX_PRODUCTS_PRODUCT = 15

export async function getProductLimitInfo(shopId: string) {
  const supabase = await createClient()

  const [{ count }, { data: activeSubscription }, { data: shop }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId),
    supabase
      .from('subscriptions')
      .select('subscription_plans ( benefits )')
      .eq('shop_id', shopId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('shops').select('categories ( is_service )').eq('id', shopId).maybeSingle(),
  ])

  const used = count ?? 0
  const benefits = activeSubscription?.subscription_plans?.benefits as
    | { max_products?: number | null }
    | null
    | undefined

  const hasActivePlan = Boolean(activeSubscription)
  const freeMax = shop?.categories?.is_service
    ? FREE_PLAN_MAX_PRODUCTS_SERVICE
    : FREE_PLAN_MAX_PRODUCTS_PRODUCT
  const max = hasActivePlan ? (benefits?.max_products ?? null) : freeMax

  return {
    used,
    max,
    reached: max !== null && used >= max,
  }
}

const FREE_PLAN_MAX_IMAGES = 3
const PAID_PLAN_MAX_IMAGES = 5

export async function getProductImageLimitInfo(shopId: string) {
  const supabase = await createClient()

  const { data: activeSubscription } = await supabase
    .from('subscriptions')
    .select('subscription_plans ( benefits )')
    .eq('shop_id', shopId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const benefits = activeSubscription?.subscription_plans?.benefits as
    | { max_images?: number | null }
    | null
    | undefined

  const hasActivePlan = Boolean(activeSubscription)
  const max = hasActivePlan
    ? (benefits?.max_images ?? PAID_PLAN_MAX_IMAGES)
    : FREE_PLAN_MAX_IMAGES

  return { max }
}

const FREE_PLAN_MAX_VARIANTS = 3
const PAID_PLAN_MAX_VARIANTS = 10

export async function getProductVariantLimitInfo(shopId: string) {
  const supabase = await createClient()

  const { data: activeSubscription } = await supabase
    .from('subscriptions')
    .select('subscription_plans ( benefits )')
    .eq('shop_id', shopId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const benefits = activeSubscription?.subscription_plans?.benefits as
    | { max_variants?: number | null }
    | null
    | undefined

  const hasActivePlan = Boolean(activeSubscription)
  const max = hasActivePlan
    ? (benefits?.max_variants ?? PAID_PLAN_MAX_VARIANTS)
    : FREE_PLAN_MAX_VARIANTS

  return { max }
}

const FREE_PLAN_MAX_VIDEOS = 3

export async function getProductVideoLimitInfo(shopId: string) {
  const supabase = await createClient()

  const [{ count }, { data: activeSubscription }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .not('video_url', 'is', null),
    supabase
      .from('subscriptions')
      .select('subscription_plans ( benefits )')
      .eq('shop_id', shopId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const used = count ?? 0
  const benefits = activeSubscription?.subscription_plans?.benefits as
    | { max_videos?: number | null }
    | null
    | undefined

  const hasActivePlan = Boolean(activeSubscription)
  const max = hasActivePlan ? (benefits?.max_videos ?? null) : FREE_PLAN_MAX_VIDEOS

  return {
    used,
    max,
    reached: max !== null && used >= max,
  }
}
