import { ComerciosPageClient } from './comercios-page-client'
import { BackLink } from '@/components/shared/back-link'
import { createPublicClient } from '@/lib/supabase/public'
import { getActiveCategories } from '@/lib/shops/queries'
import type { FeaturedShop } from '@/hooks/use-products'

const INITIAL_LIMIT = 20

// Comercios destacados + categorías son data pública (sin sesión), así que la
// página se sirve estática/ISR y se revalida cada 60s en vez de renderizarse
// dinámica por request. La lista se pagina client-side con el mismo RPC.
export const revalidate = 60

export default async function ComerciosPage() {
  const supabase = createPublicClient()

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
      <BackLink href="/" />
      <h1 className="text-lg font-semibold">Comercios</h1>
      <ComerciosPageClient initialShops={initialShops} categories={categories} />
    </div>
  )
}
