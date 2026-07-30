'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Search, Store } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { CategoryGrid } from './category-grid'
import { SubcategoryFilterSheet } from './subcategory-filter-sheet'
import { AttributeFilterSheet } from './attribute-filter-sheet'
import { ProductCard, type ProductFeedItem } from '@/components/shared/product-card'
import { BackToTopButton } from '@/components/shared/back-to-top-button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptySearchIllustration } from '@/components/shared/empty-illustrations'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoryAttributes, useProductsFeed, useShopSearch } from '@/hooks/use-products'
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
    attributeValue,
    setCategory,
    setSearch,
    setLocation,
    setAttributeValue,
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

  const {
    data: products,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsFeed()
  const { data: matchingShops } = useShopSearch()
  const { data: rubroAttributes } = useCategoryAttributes(activeRubroId)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

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

  const displayProducts = products ? products.pages.flat() : initialProducts
  const showLoading = isLoading || (isFetching && !isFetchingNextPage && !products)

  return (
    <div className="space-y-4">
      {!isLoggedIn && (
        <Link
          href="/login"
          className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-semibold">Vendé tus productos en Ledesma</p>
            <p className="text-xs text-muted-foreground">
              Creá tu cuenta gratis, abrí tu tienda y empezá a vender hoy mismo.
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
            Crear cuenta gratis
          </span>
        </Link>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos, servicios o comercios..."
            value={searchQuery}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-9"
            aria-label="Buscar productos, servicios o comercios"
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
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg border bg-surface transition-colors ${
            userLocation
              ? 'border-primary text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Usar mi ubicación"
        >
          <MapPin className="size-4" />
        </button>
      </div>

      <CategoryGrid
        categories={categories}
        selectedId={activeRubroId}
        onSelect={(id) => setCategory(id)}
      />

      <div className="flex flex-wrap gap-2">
        {visibleSubcategories.length > 0 && (
          <SubcategoryFilterSheet
            subcategories={visibleSubcategories}
            selectedId={categoryId === activeRubroId ? null : categoryId}
            onSelect={(id) => setCategory(id ?? activeRubroId)}
          />
        )}
        {rubroAttributes && rubroAttributes.length > 0 && (
          <AttributeFilterSheet
            attributes={rubroAttributes}
            selectedValue={attributeValue}
            onSelect={setAttributeValue}
          />
        )}
      </div>

      {matchingShops && matchingShops.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Comercios</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {matchingShops.map((shop) => (
              <Link
                key={shop.id}
                href={`/tienda/${shop.slug}`}
                className="flex w-56 shrink-0 items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary"
              >
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {shop.logo_url ? (
                    <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="44px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Store className="size-4" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium">{shop.name}</p>
                    {shop.verification_status === 'verified' && <VerifiedStamp className="size-4" />}
                  </div>
                  {shop.city && <p className="truncate text-xs text-muted-foreground">{shop.city}</p>}
                </div>
              </Link>
            ))}
          </div>
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
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {displayProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300"
                style={{ animationDelay: `${Math.min(index % 20, 8) * 40}ms` }}
              >
                <ProductCard
                  product={product}
                  isLoggedIn={isLoggedIn}
                  initialIsFavorite={favoriteIdSet.has(product.product_id)}
                />
              </div>
            ))}
          </div>

          <div ref={loadMoreRef} aria-hidden className="h-1" />

          {isFetchingNextPage && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          )}

          {!hasNextPage && displayProducts.length > 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Eso es todo por ahora
            </p>
          )}
        </>
      )}

      <BackToTopButton />
    </div>
  )
}
