import { createClient } from '@/lib/supabase/server'

export async function getShopBySlug(slug: string) {
  const supabase = await createClient()

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
      address,
      city,
      verification_status,
      subscription_status,
      is_paused,
      paused_reason,
      categories ( name )
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !shop) return null

  return shop
}

export async function getShopProducts(shopId: string) {
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
