'use client'

import Link from 'next/link'
import { ProductImage } from '@/components/shared/product-image'
import { FeaturedRibbon } from '@/components/shared/featured-ribbon'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { ImageOff, Play, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useShopProductsPaged } from '@/hooks/use-products'
import { useHeaderAuth } from '@/hooks/use-header-auth'
import { useMyFavoriteIds } from '@/hooks/use-my-favorite-ids'

export interface ShopProductItem {
  id: string
  name: string
  price: number | null
  currency: string
  is_featured: boolean
  wholesale_price: number | null
  min_order_qty: number | null
  video_url: string | null
  main_image: string | null
}

interface ShopProductGridProps {
  shopId: string
  initialProducts: ShopProductItem[]
  shopName: string
}

const SEARCH_THRESHOLD = 8

export function ShopProductGrid({ shopId, initialProducts, shopName }: ShopProductGridProps) {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isError, error } =
    useShopProductsPaged(shopId, searchQuery)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { data: auth } = useHeaderAuth()
  const isLoggedIn = Boolean(auth?.user)
  const { data: favoriteIds = [] } = useMyFavoriteIds()
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(value.trim()), 350)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isError) return
    console.error('useShopProductsPaged: fallo al cargar productos de la tienda', { shopId, error })
  }, [isError, error, shopId])

  const products = useMemo(
    () => (data ? data.pages.flat() : searchQuery ? [] : initialProducts),
    [data, initialProducts, searchQuery]
  )

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

  const showSearch = initialProducts.length >= SEARCH_THRESHOLD || hasNextPage

  if (products.length === 0 && !searchQuery) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {shopName} todavía no cargó productos.
        </p>
      </div>
    )
  }

  return (
    <>
      {showSearch && (
        <div className="sticky top-0 z-10 mb-3 bg-background/95 py-2 backdrop-blur-sm sm:static sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Buscar en ${shopName}...`}
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-10 pl-9"
              aria-label={`Buscar productos de ${shopName}`}
            />
          </div>
        </div>
      )}

      {searchQuery && isError ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No pudimos cargar la búsqueda. Probá de nuevo.
        </p>
      ) : searchQuery && isFetching && products.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No encontramos productos que coincidan con &quot;{searchInput}&quot;.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <Link
                  href={`/producto/${product.id}`}
                  className="block active:scale-[0.99] active:transition-transform"
                >
                  <Card
                    className={cn(
                      'overflow-hidden py-0 ring-border/60 transition-all sm:hover:-translate-y-0.5 sm:hover:shadow-md sm:hover:ring-primary/40',
                      product.is_featured && 'ring-1 ring-primary/40'
                    )}
                  >
                    <div className="relative aspect-square bg-muted">
                      {product.is_featured && <FeaturedRibbon variant="corner" />}
                      {product.main_image ? (
                        <ProductImage
                          src={product.main_image}
                          alt={product.name}
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-6" aria-hidden />
                        </div>
                      )}
                      {product.video_url && (
                        <span
                          className="absolute right-2 bottom-2 z-10 flex items-center justify-center rounded-full bg-black/55 p-1.5 text-white backdrop-blur-sm"
                          aria-label="Con video"
                        >
                          <Play className="size-3 fill-current" aria-hidden />
                        </span>
                      )}
                    </div>
                    <CardContent className="space-y-1 pb-4">
                      <p className="line-clamp-2 font-medium leading-snug">{product.name}</p>
                      <p
                        className={cn(
                          'font-mono',
                          product.price === null
                            ? 'text-sm text-muted-foreground'
                            : 'text-base font-semibold text-foreground'
                        )}
                      >
                        {product.price === null
                          ? 'Consultar precio'
                          : formatPrice(product.price, product.currency)}
                      </p>
                      {product.wholesale_price !== null && (
                        <p className="text-[11px] text-muted-foreground">
                          Por mayor {formatPrice(product.wholesale_price, product.currency)}
                          {product.min_order_qty ? ` · mín. ${product.min_order_qty}` : ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
                <FavoriteButton
                  productId={product.id}
                  initialIsFavorite={favoriteIdSet.has(product.id)}
                  isLoggedIn={isLoggedIn}
                  className="absolute top-2 right-2 z-10 size-8 transition-all active:scale-90"
                />
              </div>
            ))}
          </div>

          <div ref={loadMoreRef} aria-hidden className="h-1" />

          {isFetchingNextPage && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-xl" />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
