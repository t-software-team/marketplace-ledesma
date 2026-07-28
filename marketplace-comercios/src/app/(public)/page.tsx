import { FeedClient } from '@/components/feed/feed-client'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: categories }, { data: subcategories }, { data: initialProducts }, favorites] =
    await Promise.all([
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
      supabase.rpc('get_products_feed', {
        p_limit: 20,
        p_offset: 0,
      }),
      user
        ? supabase.from('favorites').select('product_id').eq('client_id', user.id)
        : Promise.resolve({ data: null }),
    ])

  const favoriteIds = (favorites.data ?? []).map((favorite) => favorite.product_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading">Comercios cerca tuyo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descubrí productos de emprendimientos locales
        </p>
      </div>
      <FeedClient
        categories={categories ?? []}
        subcategories={subcategories ?? []}
        initialProducts={initialProducts ?? []}
        isLoggedIn={Boolean(user)}
        favoriteIds={favoriteIds}
      />
    </div>
  )
}
