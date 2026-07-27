'use client'

import { MapPin, Search } from 'lucide-react'
import { useEffect } from 'react'
import { CategoryFilter } from '@/components/shared/category-filter'
import { ProductCard, type ProductFeedItem } from '@/components/shared/product-card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductsFeed } from '@/hooks/use-products'
import { useFiltersStore } from '@/stores/use-filters-store'

interface Category {
  id: string
  name: string
  slug: string
}

interface FeedClientProps {
  categories: Category[]
  initialProducts: ProductFeedItem[]
}

export function FeedClient({ categories, initialProducts }: FeedClientProps) {
  const {
    categoryId,
    searchQuery,
    userLocation,
    setCategory,
    setSearch,
    setLocation,
  } = useFiltersStore()

  const { data: products, isLoading, isFetching } = useProductsFeed()

  useEffect(() => {
    if (userLocation || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        setLocation(null)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [userLocation, setLocation])

  const displayProducts = products ?? initialProducts
  const showLoading = isLoading || (isFetching && !products)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            aria-label="Buscar productos"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                })
              },
              () => setLocation(null)
            )
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Usar mi ubicación"
        >
          <MapPin className="size-4" />
        </button>
      </div>

      <CategoryFilter
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategory}
      />

      {showLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No encontramos comercios en esta categoría. Probá con otra o ampliá la
            distancia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {displayProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
