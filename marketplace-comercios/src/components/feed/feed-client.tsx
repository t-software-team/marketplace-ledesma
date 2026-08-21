'use client'

import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Search, Store, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryGrid } from './category-grid'
import { ProductCard, type ProductFeedItem } from '@/components/shared/product-card'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptySearchIllustration } from '@/components/shared/empty-illustrations'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { useCategoryAttributes, useProductsFeed, useShopSearch } from '@/hooks/use-products'
import { useScrolled } from '@/hooks/use-scrolled'
import { useHideOnScrollDown } from '@/hooks/use-hide-on-scroll-down'
import { useFiltersStore } from '@/stores/use-filters-store'
import { cn } from '@/lib/utils'

const SELL_BANNER_DISMISSED_KEY = 'sell-banner-dismissed'

// Lazy-loaded: not needed for the initial paint (LCP), only rendered once
// category/attribute data is available or after the user scrolls.
const SubcategoryFilterSheet = dynamic(() =>
  import('./subcategory-filter-sheet').then((mod) => mod.SubcategoryFilterSheet)
)
const AttributeFilterSheet = dynamic(() =>
  import('./attribute-filter-sheet').then((mod) => mod.AttributeFilterSheet)
)
const BackToTopButton = dynamic(() =>
  import('@/components/shared/back-to-top-button').then((mod) => mod.BackToTopButton)
)
const FeaturedShopsRow = dynamic(() =>
  import('./featured-shops-row').then((mod) => mod.FeaturedShopsRow)
)

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
  const scrolled = useScrolled()
  const hideOnScrollDown = useHideOnScrollDown()
  const [sellBannerDismissed, setSellBannerDismissed] = useState(true)
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
    isError: isProductsError,
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProducts,
  } = useProductsFeed(initialProducts)
  const { data: matchingShops, isError: isShopSearchError, error: shopSearchError } = useShopSearch()
  const {
    data: rubroAttributes,
    isError: isAttributesError,
    error: attributesError,
  } = useCategoryAttributes(activeRubroId)

  useEffect(() => {
    if (!isShopSearchError) return
    console.error('useShopSearch: fallo al buscar comercios', shopSearchError)
    toast.add({ title: 'No pudimos buscar comercios', type: 'error' })
  }, [isShopSearchError, shopSearchError])

  useEffect(() => {
    if (!isProductsError) return
    console.error('useProductsFeed: fallo al cargar el feed', productsError)
    toast.add({ title: 'No pudimos cargar los productos', type: 'error' })
  }, [isProductsError, productsError])

  useEffect(() => {
    if (!isAttributesError) return
    console.error('useCategoryAttributes: fallo al cargar atributos del rubro', attributesError)
    toast.add({ title: 'No pudimos cargar los filtros de este rubro', type: 'error' })
  }, [isAttributesError, attributesError])

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => setSearch(value), 350)
  }

  useEffect(() => {
    setSellBannerDismissed(window.localStorage.getItem(SELL_BANNER_DISMISSED_KEY) === '1')
  }, [])

  function handleDismissSellBanner() {
    window.localStorage.setItem(SELL_BANNER_DISMISSED_KEY, '1')
    setSellBannerDismissed(true)
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [])

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


  const rawProducts = products ? products.pages.flat() : initialProducts
  // get_products_feed pagina con OFFSET sobre un orden con semilla random; si dos
  // productos empatan en el score de orden, Postgres no garantiza el mismo orden
  // entre llamadas y el mismo producto puede aparecer en dos páginas seguidas.
  const displayProducts = Array.from(
    new Map(rawProducts.map((product) => [product.product_id, product])).values()
  )
  const showLoading = isLoading || (isFetching && !isFetchingNextPage && !products)

  return (
    <div className="space-y-4">
      {!isLoggedIn && !sellBannerDismissed && (
        <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
          <button
            type="button"
            onClick={handleDismissSellBanner}
            aria-label="Cerrar"
            className="absolute top-2.5 right-2.5 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
          <Link
            href="/login"
            className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-center sm:justify-between sm:pr-10"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">Vendé tus productos en Proxi</p>
              <p className="text-xs text-muted-foreground">
                Creá tu cuenta gratis, abrí tu tienda y empezá a vender hoy mismo.
              </p>
            </div>
            <span className="flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:inline-flex">
              Crear cuenta gratis
            </span>
          </Link>
        </div>
      )}

      <div
        className={cn(
          'sticky top-14 z-10 -mx-4 overflow-hidden transition-transform duration-200 will-change-transform md:-mx-6',
          hideOnScrollDown ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div
          className={cn(
            'flex gap-2 px-4 py-2 transition-all duration-200 md:px-6',
            scrolled ? 'bg-background/95 pt-3 backdrop-blur-sm ' : 'bg-transparent backdrop-blur-md'
          )}
        >
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos, servicios o comercios..."
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-11 rounded-full border-transparent bg-muted pl-10 pr-10 focus-visible:bg-surface"
              aria-label="Buscar productos, servicios o comercios"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                toast.add({ title: 'Tu navegador no soporta geolocalización', type: 'error' })
                return
              }
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  })
                },
                () => {
                  setLocation(null)
                  toast.add({
                    title: 'No pudimos acceder a tu ubicación',
                    description: 'Revisá los permisos de ubicación en tu navegador e intentá de nuevo.',
                    type: 'error',
                  })
                }
              )
            }}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
              userLocation
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Usar mi ubicación"
          >
            <MapPin className="size-4" />
          </button>
        </div>
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

      {!searchQuery && !categoryId && <FeaturedShopsRow />}

      {isShopSearchError && searchQuery.trim().length >= 2 && (
        <p className="text-sm text-destructive">No pudimos buscar comercios. Probá de nuevo.</p>
      )}

      {matchingShops && matchingShops.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Comercios</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {matchingShops.map((shop) => (
              <Link
                key={shop.id}
                href={`/tienda/${shop.slug}`}
                className="flex w-56 shrink-0 items-center gap-3 rounded-xl bg-surface p-3 transition-opacity hover:opacity-70"
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
                    {hasVerifiedBadge(shop) && <VerifiedStamp className="size-4" />}
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
      ) : isProductsError && displayProducts.length === 0 ? (
        <EmptyState
          illustration={<EmptySearchIllustration />}
          message="No pudimos cargar los productos. Revisá tu conexión e intentá de nuevo."
          action={
            <button
              type="button"
              onClick={() => refetchProducts()}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Reintentar
            </button>
          }
        />
      ) : displayProducts.length === 0 ? (
        <EmptyState
          illustration={<EmptySearchIllustration />}
          message="No encontramos productos que coincidan. Probá con otra búsqueda, categoría o ampliá la distancia."
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
                  priority={index < 4}
                />
              </div>
            ))}
          </div>

          <div ref={loadMoreRef} aria-hidden className="h-24" />

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
