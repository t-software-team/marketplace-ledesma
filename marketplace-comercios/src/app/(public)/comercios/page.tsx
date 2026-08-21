import { ComerciosPageClient } from './comercios-page-client'
import { createClient } from '@/lib/supabase/server'
import { getActiveCategories } from '@/lib/shops/queries'
import type { FeaturedShop } from '@/hooks/use-products'

const INITIAL_LIMIT = 20

export default async function ComerciosPage() {
  const supabase = await createClient()

  const [{ data, error }, categories] = await Promise.all([
    supabase.rpc('get_featured_shops', {
      p_limit: INITIAL_LIMIT,
      p_offset: 0,
    }),
    getActiveCategories(),
  ])

  if (error) {
    console.error('ComerciosPage: fallo al cargar comercios', error)
  }

  // undefined (no []) cuando falla: un array vacío es "truthy" y el hook lo
  // sembraría como initialData válido, mostrando "no hay comercios" en vez
  // del estado de error real — con undefined el cliente hace su propio
  // fetch y expone isError correctamente.
  const initialShops = error ? undefined : ((data ?? []) as FeaturedShop[])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Comercios</h1>
      <ComerciosPageClient initialShops={initialShops} categories={categories} />
    </div>
  )
}
