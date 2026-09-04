import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { isServiceRubro } from '@/lib/category-icons'
import {
  getMyActiveSubscription,
  getMyPromotions,
  getMyShop,
  getMyShopProducts,
} from '@/lib/shops/queries'
import { CreatePromotionForm } from './create-promotion-form'
import { PromotionCard } from './promotion-card'
import { PromotionsUpsell } from './promotions-upsell'

export default async function PromotionsPage() {
  const shop = await getMyShop()

  if (!shop) redirect('/mi-tienda')

  const [activeSubscription, promotions, productsResult] = await Promise.all([
    getMyActiveSubscription(shop.id),
    getMyPromotions(shop.id),
    getMyShopProducts(shop.id, 1, 200),
  ])
  const { products } = productsResult

  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'
  const hasPromotions = Boolean(
    (activeSubscription?.subscription_plans?.benefits as { promotions?: boolean } | null)
      ?.promotions
  )

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const shopUrl = `${protocol}://${host}/tienda/${shop.slug}`

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-heading">Promociones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publicá una promo con imagen y texto que aparece destacada en el feed por 1 a 3 días
        </p>
      </div>

      {!hasPromotions ? (
        <PromotionsUpsell noun={noun} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <CreatePromotionForm
              shopId={shop.id}
              products={products.map((product) => ({
                id: product.id,
                name: product.name,
                image_urls: product.image_urls,
              }))}
              noun={noun}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-heading text-lg">Tus promociones</h2>
        {promotions.length === 0 ? (
          <EmptyState message="Todavía no creaste ninguna promoción." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {promotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                id={promotion.id}
                imageUrl={promotion.image_url}
                text={promotion.text}
                expiresAt={promotion.expires_at}
                productName={promotion.products?.name}
                shopUrl={shopUrl}
                textPosition={(promotion.text_position as 'top' | 'center' | 'bottom') || 'bottom'}
                textSize={(promotion.text_size as 'sm' | 'md' | 'lg') || 'md'}
                textColor={promotion.text_color || '#ffffff'}
                bgColor={promotion.bg_color || '#000000'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
