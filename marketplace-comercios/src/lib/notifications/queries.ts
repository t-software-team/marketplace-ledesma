import { createClient } from '@/lib/supabase/server'

export async function getMyClientNotifications() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { notifications: [], unreadCount: 0 }

  const [{ data: notifications }, { count }] = await Promise.all([
    supabase
      .from('client_notifications')
      .select('id, type, reference_id, is_read, created_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('client_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('is_read', false),
  ])

  return { notifications: notifications ?? [], unreadCount: count ?? 0 }
}

export interface PaginatedClientNotifications {
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

async function getMyClientNotificationsPage(
  page: number,
  pageSize: number
): Promise<PaginatedClientNotifications> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { notifications: [], totalCount: 0, totalPages: 0 }

  const safePage = Math.max(1, page)
  const from = (safePage - 1) * pageSize
  const to = safePage * pageSize - 1

  const { data, count } = await supabase
    .from('client_notifications')
    .select('id, type, reference_id, is_read, created_at', { count: 'exact' })
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalCount = count ?? 0

  return {
    notifications: data ?? [],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  }
}

/**
 * Shop-owner notification history (`/mi-tienda/notificaciones`), enriched
 * with the underlying review/contact record so the page can show details
 * beyond the generic notification label.
 */
export interface ShopNotificationDetails {
  id: string
  type: string
  reference_id: string
  is_read: boolean
  created_at: string
  review?: { rating: number; comment: string | null } | null
  contact?: { productId: string | null; productName: string | null } | null
}

export async function getMyShopNotifications(
  page = 1,
  pageSize = 30
): Promise<{ notifications: ShopNotificationDetails[]; totalCount: number; totalPages: number }> {
  const { notifications, totalCount, totalPages } = await getMyClientNotificationsPage(
    page,
    pageSize
  )

  const supabase = await createClient()

  const reviewIds = notifications.filter((n) => n.type === 'new_review').map((n) => n.reference_id)
  const contactIds = notifications
    .filter((n) => n.type === 'new_contact')
    .map((n) => n.reference_id)

  const [{ data: reviews }, { data: contacts }] = await Promise.all([
    reviewIds.length
      ? supabase.from('shop_reviews').select('id, rating, comment').in('id', reviewIds)
      : Promise.resolve({ data: [] as { id: string; rating: number; comment: string | null }[] }),
    contactIds.length
      ? supabase
          .from('shop_contacts')
          .select('id, product_id, products ( name )')
          .in('id', contactIds)
      : Promise.resolve({
          data: [] as { id: string; product_id: string | null; products: { name: string } | null }[],
        }),
  ])

  const reviewById = new Map((reviews ?? []).map((r) => [r.id, r]))
  const contactById = new Map((contacts ?? []).map((c) => [c.id, c]))

  return {
    notifications: notifications.map((notification) => {
      if (notification.type === 'new_review') {
        const review = reviewById.get(notification.reference_id)
        return {
          ...notification,
          review: review ? { rating: review.rating, comment: review.comment } : null,
        }
      }
      if (notification.type === 'new_contact') {
        const contact = contactById.get(notification.reference_id)
        return {
          ...notification,
          contact: contact
            ? { productId: contact.product_id, productName: contact.products?.name ?? null }
            : null,
        }
      }
      return notification
    }),
    totalCount,
    totalPages,
  }
}

/**
 * Buyer notification history (`/notificaciones`), enriched with the product
 * and shop that triggered a `new_product` notification.
 */
export interface BuyerNotificationDetails {
  id: string
  type: string
  reference_id: string
  is_read: boolean
  created_at: string
  product?: {
    name: string
    imageUrl: string | null
    shopName: string | null
    shopSlug: string | null
  } | null
}

export async function getMyBuyerNotifications(
  page = 1,
  pageSize = 30
): Promise<{ notifications: BuyerNotificationDetails[]; totalCount: number; totalPages: number }> {
  const { notifications, totalCount, totalPages } = await getMyClientNotificationsPage(
    page,
    pageSize
  )

  const supabase = await createClient()

  const productIds = notifications
    .filter((n) => n.type === 'new_product')
    .map((n) => n.reference_id)

  const { data: products } = productIds.length
    ? await supabase
        .from('products')
        .select('id, name, product_images ( url, sort_order ), shops ( name, slug )')
        .in('id', productIds)
    : { data: [] as never[] }

  const productById = new Map(
    (products ?? []).map((p) => {
      const images = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
      return [
        p.id,
        {
          name: p.name,
          imageUrl: images[0]?.url ?? null,
          shopName: p.shops?.name ?? null,
          shopSlug: p.shops?.slug ?? null,
        },
      ] as const
    })
  )

  return {
    notifications: notifications.map((notification) => ({
      ...notification,
      product:
        notification.type === 'new_product'
          ? (productById.get(notification.reference_id) ?? null)
          : undefined,
    })),
    totalCount,
    totalPages,
  }
}
