'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Store } from 'lucide-react'
import { useEffect } from 'react'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { useFeaturedShops } from '@/hooks/use-products'

export function FeaturedShopsRow() {
  const { data: shops, isLoading, isError, error } = useFeaturedShops()

  useEffect(() => {
    if (!isError) return
    console.error('useFeaturedShops: fallo al cargar comercios destacados', error)
    toast.add({ title: 'No pudimos cargar los comercios', type: 'error' })
  }, [isError, error])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Comercios</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-56 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!shops || shops.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Comercios</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shops.map((shop) => (
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
              <div className="flex items-center gap-2">
                {shop.city && <p className="truncate text-xs text-muted-foreground">{shop.city}</p>}
                {shop.review_count > 0 && shop.avg_rating !== null && (
                  <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="size-3 fill-current" aria-hidden />
                    {shop.avg_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
