import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isServiceRubro } from '@/lib/category-icons'
import {
  getCategoryAttributes,
  getMyShop,
  getProductImageLimitInfo,
  getProductLimitInfo,
  getProductVariantLimitInfo,
  getProductVideoLimitInfo,
  getSubcategories,
} from '@/lib/shops/queries'
import { createProduct } from '@/lib/shops/actions'
import { BackLink } from '@/components/shared/back-link'
import { ProductForm } from '../product-form'

export default async function NewProductPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'

  const limitInfo = await getProductLimitInfo(shop.id)
  if (limitInfo.reached) {
    return (
      <div className="max-w-2xl space-y-4">
        <BackLink href="/mi-tienda/productos" />
        <h1 className="text-2xl font-heading">Nuevo {noun}</h1>
        <p className="rounded-lg border border-warning bg-warning/30 p-3 text-sm text-warning-foreground">
          Llegaste al límite de {limitInfo.max} {noun}s de tu plan actual.{' '}
          <Link href="/mi-tienda/suscripcion" className="underline">
            Mejorá tu suscripción
          </Link>{' '}
          para seguir cargando.
        </p>
      </div>
    )
  }

  if (!shop.category_id) {
    return (
      <div className="max-w-2xl space-y-4">
        <BackLink href="/mi-tienda/productos" />
        <h1 className="text-2xl font-heading">Nuevo {noun}</h1>
        <p className="text-sm text-muted-foreground">
          Antes de cargar {noun}s, elegí el rubro de tu comercio en{' '}
          <Link href="/mi-tienda/configuracion" className="underline">
            Configuración
          </Link>{' '}
          — así podés elegir la subcategoría correcta.
        </p>
      </div>
    )
  }

  const [categories, attributeDefs, videoLimitInfo, imageLimitInfo, variantLimitInfo] = await Promise.all([
    getSubcategories(shop.category_id),
    getCategoryAttributes(shop.category_id),
    getProductVideoLimitInfo(shop.id),
    getProductImageLimitInfo(shop.id),
    getProductVariantLimitInfo(shop.id),
  ])

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/productos" />
      <h1 className="text-2xl font-heading">Nuevo {noun}</h1>
      <ProductForm
        shopId={shop.id}
        shopRubroId={shop.category_id}
        categories={categories}
        attributeDefs={attributeDefs}
        action={createProduct}
        submitLabel={`Crear ${noun}`}
        isService={isService}
        videoLimitReached={videoLimitInfo.reached}
        maxImages={imageLimitInfo.max}
        maxVariants={variantLimitInfo.max}
      />
    </div>
  )
}
