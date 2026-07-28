'use client'

import { ArrowLeft, MapPin, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { CategoryGrid } from './category-grid'
import { SubcategoryFilterSheet } from './subcategory-filter-sheet'
import { ProductCard, type ProductFeedItem } from '@/components/shared/product-card'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptySearchIllustration } from '@/components/shared/empty-illustrations'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductsFeed } from '@/hooks/use-products'
import { useFiltersStore } from '@/stores/use-filters-store'

interface Category {
  id: string
  name: string
  slug: string
}

interface Subcategory extends Category {
  parent_id: string | null
}

interface FeedClientProps {
  categories: Category[]
  subcategories: Subcategory[]
  initialProducts: ProductFeedItem[]
  isLoggedIn?: boolean
  favoriteIds?: string[]
}

export function FeedClient({
  categories,
  subcategories,
  initialProducts,
  isLoggedIn = false,
  favoriteIds = [],
}: FeedClientProps) {
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])
  const {
    categoryId,
    searchQuery,
    userLocation,
    setCategory,
    setSearch,
    setLocation,
  } = useFiltersStore()

  const activeRubroId = useMemo(() => {
    if (!categoryId) return null
    if (categories.some((category) => category.id === categoryId)) return categoryId
    return subcategories.find((sub) => sub.id === categoryId)?.parent_id ?? null
  }, [categoryId, categories, subcategories])

  const visibleSubcategories = useMemo(
    () => subcategories.filter((sub) => sub.parent_id === activeRubroId),
    [subcategories, activeRubroId]
  )

  const activeRubroName = useMemo(
    () => categories.find((category) => category.id === activeRubroId)?.name,
    [categories, activeRubroId]
  )

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
  const isBrowsingCategories = !categoryId && !searchQuery.trim()

  return (
    <div className="space-y-4">
      <div className="relative space-y-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6 shadow-sm">
        <span
          className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-primary opacity-20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-inner">
            <Sparkles className="size-3" aria-hidden />
            Cerca tuyo
          </span>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
            Comercios cerca tuyo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Descubrí productos de emprendimientos locales
          </p>
        </div>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 pl-9"
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
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Usar mi ubicación"
          >
            <MapPin className="size-4" />
          </button>
        </div>
      </div>

      {isBrowsingCategories ? (
        <CategoryGrid categories={categories} onSelect={setCategory} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory(null)
                setSearch('')
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Categorías
            </button>
            {activeRubroName && (
              <span className="font-heading text-sm text-foreground">{activeRubroName}</span>
            )}
          </div>

          {visibleSubcategories.length > 0 && (
            <div className="border-t border-dashed border-border pt-3">
              <SubcategoryFilterSheet
                subcategories={visibleSubcategories}
                selectedId={categoryId === activeRubroId ? null : categoryId}
                onSelect={(id) => setCategory(id ?? activeRubroId)}
              />
            </div>
          )}

          {showLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <EmptyState
              illustration={<EmptySearchIllustration />}
              message="No encontramos comercios en esta categoría. Probá con otra o ampliá la distancia."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {displayProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <ProductCard
                    product={product}
                    isLoggedIn={isLoggedIn}
                    initialIsFavorite={favoriteIdSet.has(product.product_id)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
