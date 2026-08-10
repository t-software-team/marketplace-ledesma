import { FeedClient } from '@/components/feed/feed-client'
import { PromotionsRow } from '@/components/feed/promotions-row'
import { createClient } from '@/lib/supabase/server'
import { getActivePromotions, getFeedData } from '@/lib/shops/queries'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    {
      data: { user },
    },
    { categories, subcategories, products: initialProducts },
    promotions,
  ] = await Promise.all([supabase.auth.getUser(), getFeedData(20, 0), getActivePromotions()])

  const favorites = user
    ? await supabase.from('favorites').select('product_id').eq('client_id', user.id)
    : { data: null }

  const favoriteIds = (favorites.data ?? []).map((favorite) => favorite.product_id)

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
        isLoggedIn={Boolean(user)}
        favoriteIds={favoriteIds}
      />
    </div>
  )
}
