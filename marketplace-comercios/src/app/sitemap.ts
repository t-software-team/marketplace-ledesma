import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/site-url'
import { getSitemapShops } from '@/lib/shops/queries'

// Products are excluded for now: there is no dedicated cached query that
// selects only active product ids + updated_at without shop/category joins,
// and the volume of products is expected to be much larger than shops.
// Add a getSitemapProducts query (mirroring getSitemapShops) if/when needed.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const shops = await getSitemapShops()

  const shopRoutes: MetadataRoute.Sitemap = shops.map((shop) => ({
    url: `${baseUrl}/tienda/${shop.slug}`,
    lastModified: shop.updated_at ? new Date(shop.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...shopRoutes]
}
