'use client'

import Link from 'next/link'
import { ProductImage } from '@/components/shared/product-image'
import { FeaturedRibbon } from '@/components/shared/featured-ribbon'
import { ChevronRight, Play, Search, Wrench } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useShopProductsPaged } from '@/hooks/use-products'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import type { ShopProductItem } from '@/components/shop/shop-product-grid'

interface ShopServiceListProps {
  shopId: string
  initialProducts: ShopProductItem[]
  shopName: string
  whatsappNumber: string | null
}

const SEARCH_THRESHOLD = 8

export function ShopServiceList({
  shopId,
  initialProducts,
  shopName,
  whatsappNumber,
}: ShopServiceListProps) {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isError, error } =
    useShopProductsPaged(shopId, searchQuery)
  const loadMoreRef = useRef<HTMLDivElement>(null)

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
    console.error('useShopProductsPaged: fallo al cargar servicios de la tienda', { shopId, error })
  }, [isError, error, shopId])

  const services = useMemo(
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

  if (services.length === 0 && !searchQuery) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {shopName} todavía no cargó servicios.
        </p>
      </div>
    )
  }

  return (
    <>
      {showSearch && (
        <div className="sticky top-14 z-10 mb-3 bg-background/95 py-2 backdrop-blur-sm sm:static sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Buscar servicio en ${shopName}...`}
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-10 pl-9"
              aria-label={`Buscar servicios de ${shopName}`}
            />
          </div>
        </div>
      )}

      {searchQuery && isError ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No pudimos cargar la búsqueda. Probá de nuevo.
        </p>
      ) : searchQuery && isFetching && services.length === 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No encontramos servicios que coincidan con &quot;{searchInput}&quot;.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className={cn(
                  'overflow-hidden py-0 ring-border/60 transition-all sm:hover:-translate-y-0.5 sm:hover:shadow-md sm:hover:ring-primary/40',
                  service.is_featured && 'ring-1 ring-primary/40'
                )}
              >
                <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                  <Link
                    href={`/producto/${service.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 active:scale-[0.99] active:transition-transform sm:gap-4"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-16">
                      {service.main_image ? (
                        <ProductImage
                          src={service.main_image}
                          alt={service.name}
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Wrench className="size-6" />
                        </div>
                      )}
                      {service.video_url && (
                        <span
                          className="absolute right-1 bottom-1 z-10 flex items-center justify-center rounded-full bg-black/55 p-1 text-white backdrop-blur-sm"
                          aria-label="Con video"
                        >
                          <Play className="size-2.5 fill-current" aria-hidden />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {service.is_featured && <FeaturedRibbon variant="inline" />}
                      <p className="line-clamp-2 font-medium leading-snug">{service.name}</p>
                      <p
                        className={cn(
                          'font-mono',
                          service.price === null
                            ? 'text-sm text-muted-foreground'
                            : 'text-base font-semibold text-foreground'
                        )}
                      >
                        {service.price === null
                          ? 'Consultar precio'
                          : formatPrice(service.price, service.currency)}
                      </p>
                      {service.wholesale_price !== null && (
                        <p className="text-[11px] text-muted-foreground">
                          Por mayor {formatPrice(service.wholesale_price, service.currency)}
                          {service.min_order_qty ? ` · mín. ${service.min_order_qty}` : ''}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                  </Link>

                  {whatsappNumber && (
                    <WhatsAppButton
                      phoneNumber={whatsappNumber}
                      shopId={shopId}
                      message={`Hola ${shopName}, quiero consultar sobre "${service.name}"`}
                      variant="outline"
                      iconOnly
                      className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div ref={loadMoreRef} aria-hidden className="h-1" />

          {isFetchingNextPage && (
            <div className="mt-3 flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
