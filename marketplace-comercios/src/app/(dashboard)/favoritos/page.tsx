import { ProductCard } from '@/components/shared/product-card'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyHeartIllustration } from '@/components/shared/empty-illustrations'
import { getMyFavorites } from '@/lib/shops/queries'

export default async function FavoritesPage() {
  const favorites = await getMyFavorites()

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-heading">Favoritos</h1>

      {favorites.length === 0 ? (
        <EmptyState
          illustration={<EmptyHeartIllustration />}
          message="Todavía no guardaste ningún favorito. Explorá el feed y tocá el corazón en los productos que te gusten."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {favorites.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              isLoggedIn
              initialIsFavorite
            />
          ))}
        </div>
      )}
    </div>
  )
}
