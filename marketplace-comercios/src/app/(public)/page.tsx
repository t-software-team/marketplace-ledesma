import { FeedClient } from '@/components/feed/feed-client'
import { createClient } from '@/lib/supabase/server'
import { getFeedData } from '@/lib/shops/queries'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ categories, subcategories, products: initialProducts }, favorites] = await Promise.all([
    getFeedData(20, 0),
    user
      ? supabase.from('favorites').select('product_id').eq('client_id', user.id)
      : Promise.resolve({ data: null }),
  ])

  const favoriteIds = (favorites.data ?? []).map((favorite) => favorite.product_id)

  return (
    <div className="space-y-6">
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
