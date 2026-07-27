import { FeedClient } from '@/components/feed/feed-client'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: initialProducts }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('name'),
    supabase.rpc('get_products_feed', {
      p_limit: 20,
      p_offset: 0,
    }),
  ])

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
        initialProducts={initialProducts ?? []}
      />
    </div>
  )
}
