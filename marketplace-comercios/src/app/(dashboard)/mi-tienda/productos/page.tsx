import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { isServiceRubro } from '@/lib/category-icons'
import { getMyShop, getMyShopProducts, getProductLimitInfo } from '@/lib/shops/queries'
import { PaginationLinks } from '@/components/shared/pagination-links'
import { ProductsList } from './products-list'

interface ProductsPageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const search = q?.trim() || undefined
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const isService = isServiceRubro(shop.categories?.slug)
  const productsResult = await getMyShopProducts(shop.id, page, 24, search)
  const { products, totalCount, totalPages } = productsResult
  // Sin búsqueda, totalCount es el conteo total de productos de la tienda, así
  // que se reusa como usedCount y getProductLimitInfo evita un segundo
  // count: 'exact'. isService ya viene del getMyShop cacheado.
  const limitInfo = await getProductLimitInfo(shop.id, {
    usedCount: search ? undefined : totalCount,
    isService,
    categoryId: shop.category_id,
  })
  const noun = isService ? 'servicio' : 'producto'
  const nounPlural = isService ? 'Servicios' : 'Productos'
  const canFeature = shop.subscription_status === 'active'

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-heading">{nounPlural}</h1>
          <p className="text-xs text-muted-foreground">
            {limitInfo.used} de {limitInfo.max ?? 'ilimitados'} usados
          </p>
        </div>
        {limitInfo.reached ? (
          <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false}>
            Mejorar plan
          </Button>
        ) : (
          <Button render={<Link href="/mi-tienda/productos/nuevo" />} nativeButton={false}>
            Nuevo {noun}
          </Button>
        )}
      </div>

      {limitInfo.reached && (
        <p className="rounded-lg border border-warning bg-warning/30 p-3 text-sm text-warning-foreground">
          Llegaste al límite de {limitInfo.max} {noun}s de tu plan actual.{' '}
          <Link href="/mi-tienda/suscripcion" className="underline">
            Mejorá tu suscripción
          </Link>{' '}
          para seguir cargando.
        </p>
      )}

      {totalCount === 0 && !search ? (
        <EmptyState
          illustration={<EmptyBoxIllustration />}
          message={`Todavía no cargaste ningún ${noun}. Agregá el primero para aparecer en el feed.`}
          action={
            <Button render={<Link href="/mi-tienda/productos/nuevo" />} nativeButton={false} size="sm">
              Cargar {noun}
            </Button>
          }
        />
      ) : (
        <>
          {!canFeature && (
            <p className="text-xs text-muted-foreground">
              Con una suscripción activa podés destacar tus {noun}s para que aparezcan primero en
              el feed.{' '}
              <Link href="/mi-tienda/suscripcion" className="underline">
                Mejorar visibilidad
              </Link>
            </p>
          )}
          <ProductsList
            products={products}
            noun={noun}
            canFeature={canFeature}
            totalCount={totalCount}
            search={search}
            basePath="/mi-tienda/productos"
          />
          <PaginationLinks
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            basePath="/mi-tienda/productos"
            extraQuery={search ? { q: search } : undefined}
          />
        </>
      )}
    </div>
  )
}
