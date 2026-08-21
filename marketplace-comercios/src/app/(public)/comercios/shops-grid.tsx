'use client'

import { useEffect, useRef } from 'react'
import { ShopCard } from '@/components/shared/shop-card'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptySearchIllustration } from '@/components/shared/empty-illustrations'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { useFeaturedShopsInfinite } from '@/hooks/use-products'
import type { FeaturedShop } from '@/hooks/use-products'

interface ShopsGridProps {
  initialShops: FeaturedShop[]
}

export function ShopsGrid({ initialShops }: ShopsGridProps) {
  const {
    data: shops,
    isLoading,
    isFetching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFeaturedShopsInfinite(initialShops)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isError) return
    console.error('useFeaturedShopsInfinite: fallo al cargar comercios', error)
    toast.add({ title: 'No pudimos cargar los comercios', type: 'error' })
  }, [isError, error])

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

  const displayShops = shops ? shops.pages.flat() : initialShops
  const showLoading = isLoading || (isFetching && !isFetchingNextPage && !shops)

  if (showLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[76px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError && displayShops.length === 0) {
    return (
      <EmptyState
        illustration={<EmptySearchIllustration />}
        message="No pudimos cargar los comercios. Revisá tu conexión e intentá de nuevo."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        }
      />
    )
  }

  if (displayShops.length === 0) {
    return (
      <EmptyState
        illustration={<EmptySearchIllustration />}
        message="Todavía no hay comercios activos para mostrar."
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {displayShops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>

      <div ref={loadMoreRef} aria-hidden className="h-24" />

      {!hasNextPage && displayShops.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">Eso es todo por ahora</p>
      )}
    </>
  )
}
