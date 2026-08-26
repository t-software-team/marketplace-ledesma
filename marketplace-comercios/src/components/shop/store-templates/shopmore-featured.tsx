'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ProductImage } from '@/components/shared/product-image'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { formatPrice } from '@/lib/format'
import { useHeaderAuth } from '@/hooks/use-header-auth'
import { useMyFavoriteIds } from '@/hooks/use-my-favorite-ids'

export interface ShopmoreFeaturedItem {
  id: string
  name: string
  price: number | null
  currency: string
  main_image: string | null
}

/**
 * Fila horizontal de destacados con la UI del mockup (card blanca, corazón de
 * favorito, precio en color de acento). Client porque resuelve login/favoritos.
 */
export function ShopmoreFeatured({
  title,
  products,
}: {
  title: string
  products: ShopmoreFeaturedItem[]
}) {
  const { data: auth } = useHeaderAuth()
  const isLoggedIn = Boolean(auth?.user)
  const { data: favoriteIds = [] } = useMyFavoriteIds()
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  if (products.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">{title}</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        {products.map((product) => (
          <div key={product.id} className="relative w-40 shrink-0 sm:w-44">
            <Link
              href={`/producto/${product.id}`}
              className="block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-square bg-muted">
                {product.main_image ? (
                  <ProductImage
                    src={product.main_image}
                    alt={product.name}
                    className="object-cover"
                    sizes="176px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                <p className="text-base font-semibold text-primary">
                  {product.price === null ? 'Consultar' : formatPrice(product.price, product.currency)}
                </p>
              </div>
            </Link>
            <FavoriteButton
              productId={product.id}
              initialIsFavorite={favoriteIdSet.has(product.id)}
              isLoggedIn={isLoggedIn}
              className="absolute top-2 right-2 z-10 size-8"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
