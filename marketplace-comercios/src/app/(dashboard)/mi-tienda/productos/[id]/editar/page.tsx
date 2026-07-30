import { notFound, redirect } from 'next/navigation'
import { isServiceRubro } from '@/lib/category-icons'
import {
  getCategoryAttributes,
  getMyProduct,
  getMyShop,
  getProductAttributeValues,
  getSubcategories,
} from '@/lib/shops/queries'
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

  const [categories, attributeDefs, attributeValues] = await Promise.all([
    getSubcategories(shop.category_id),
    getCategoryAttributes(shop.category_id),
    getProductAttributeValues(product.id),
  ])
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const variants = [...(product.product_variants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  const updateProductWithId = updateProduct.bind(null, product.id)
  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'

  const defaultAttributes: Record<string, string | string[]> = {}
  for (const row of attributeValues) {
    const key = row.category_attributes?.key
    if (!key) continue
    const isMultiselect =
      row.category_attributes?.type === 'multiselect' || row.category_attributes?.type === 'multicolor'
    if (isMultiselect) {
      const current = defaultAttributes[key]
      defaultAttributes[key] = Array.isArray(current) ? [...current, row.value] : [row.value]
    } else {
      defaultAttributes[key] = row.value
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/productos" />
      <h1 className="text-2xl font-heading">Editar {noun}</h1>
      <ProductForm
        shopId={shop.id}
        shopRubroId={shop.category_id}
        categories={categories}
        attributeDefs={attributeDefs}
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
          variants: variants.map((v) => ({ name: v.name, price: v.price })),
          attributes: defaultAttributes,
        }}
      />
    </div>
  )
}
