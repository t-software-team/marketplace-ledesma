'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/format'
import { useShopProductsPaged } from '@/hooks/use-products'

export interface ShopProductItem {
  id: string
  name: string
  price: number | null
  currency: string
  mainImage: string | null
}

interface ShopProductGridProps {
  shopId: string
  initialProducts: ShopProductItem[]
  shopName: string
}

const SEARCH_THRESHOLD = 8

export function ShopProductGrid({ shopId, initialProducts, shopName }: ShopProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useShopProductsPaged(
    shopId,
    searchQuery
  )
  const loadMoreRef = useRef<HTMLDivElement>(null)

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
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Buscar en ${shopName}...`}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 pl-9"
            aria-label={`Buscar productos de ${shopName}`}
          />
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No encontramos productos que coincidan con &quot;{searchQuery}&quot;.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/producto/${product.id}`} className="block">
                <Card className="overflow-hidden py-0 ring-border/60 transition-colors hover:ring-primary/30">
                  <div className="relative aspect-square bg-muted">
                    {product.mainImage ? (
                      <Image
                        src={product.mainImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-1 pb-4">
                    <p className="line-clamp-2 font-medium leading-snug">{product.name}</p>
                    <p className="font-mono text-sm">{formatPrice(product.price, product.currency)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div ref={loadMoreRef} aria-hidden className="h-1" />

          {isFetchingNextPage && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
