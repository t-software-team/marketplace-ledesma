import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const supabase = await createClient()

  const [{ data: shops }, { data: products }] = await Promise.all([
    supabase
      .from('shops')
      .select('slug, updated_at')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5000),
    supabase
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(5000),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'hourly', priority: 1 },
  ]

  const shopRoutes: MetadataRoute.Sitemap = (shops ?? []).map((shop) => ({
    url: `${baseUrl}/tienda/${shop.slug}`,
    lastModified: shop.updated_at,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
    url: `${baseUrl}/producto/${product.id}`,
    lastModified: product.updated_at,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [...staticRoutes, ...shopRoutes, ...productRoutes]
}
