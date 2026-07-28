import { notFound, redirect } from 'next/navigation'
import { isServiceRubro } from '@/lib/category-icons'
import { getMyProduct, getMyShop, getSubcategories } from '@/lib/shops/queries'
import { updateProduct } from '@/lib/shops/actions'
import { BackLink } from '@/components/shared/back-link'
import { ProductForm } from '../../product-form'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const product = await getMyProduct(id)

  if (!product || product.shop_id !== shop.id) {
    notFound()
  }

  const categories = await getSubcategories(shop.category_id)
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  const updateProductWithId = updateProduct.bind(null, product.id)
  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/productos" />
      <h1 className="text-2xl font-heading">Editar {noun}</h1>
      <ProductForm
        shopId={shop.id}
        categories={categories}
        action={updateProductWithId}
        submitLabel="Guardar cambios"
        isService={isService}
        defaultValues={{
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency,
          category_id: product.category_id,
          is_active: product.is_active,
          imageUrls: images.map((image) => image.url),
          videoUrl: product.video_url,
        }}
      />
    </div>
  )
}
