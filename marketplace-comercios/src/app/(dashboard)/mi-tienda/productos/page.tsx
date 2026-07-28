import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { isServiceRubro } from '@/lib/category-icons'
import { getMyShop, getMyShopProducts, getProductLimitInfo } from '@/lib/shops/queries'
import { ProductsList } from './products-list'

export default async function ProductsPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const [products, limitInfo] = await Promise.all([
    getMyShopProducts(shop.id),
    getProductLimitInfo(shop.id),
  ])
  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'
  const nounPlural = isService ? 'Servicios' : 'Productos'

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

      {products.length === 0 ? (
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
        <ProductsList products={products} noun={noun} />
      )}
    </div>
  )
}
