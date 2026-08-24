import { FeedClient } from '@/components/feed/feed-client'
import { PromotionsRow } from '@/components/feed/promotions-row'
import { getActivePromotions, getFeedData } from '@/lib/shops/queries'

// El feed no depende de la sesión: FeedClient resuelve login + favoritos en el
// cliente (useHeaderAuth / useMyFavoriteIds), así la página —la más visitada—
// se sirve estática/ISR y se revalida cada 30s, igual que la caché de
// getFeedData/getActivePromotions.
export const revalidate = 30

export default async function HomePage() {
  const [{ categories, subcategories, products: initialProducts }, promotions] = await Promise.all([
    getFeedData(20, 0),
    getActivePromotions(),
  ])

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/[0.16] to-transparent" />
        <div className="absolute top-[-12%] left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-primary/[0.18] blur-3xl" />
      </div>
      {promotions.length > 0 && <PromotionsRow promotions={promotions} />}
      <FeedClient
        categories={categories}
        subcategories={subcategories}
        initialProducts={initialProducts}
      />
    </div>
  )
}
