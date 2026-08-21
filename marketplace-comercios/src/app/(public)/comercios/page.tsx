import { ShopsGrid } from './shops-grid'
import { createClient } from '@/lib/supabase/server'
import type { FeaturedShop } from '@/hooks/use-products'

const INITIAL_LIMIT = 20

export default async function ComerciosPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_featured_shops', {
    p_limit: INITIAL_LIMIT,
    p_offset: 0,
  })

  if (error) {
    console.error('ComerciosPage: fallo al cargar comercios', error)
  }

  const initialShops = (data ?? []) as FeaturedShop[]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Comercios</h1>
      <ShopsGrid initialShops={initialShops} />
    </div>
  )
}
