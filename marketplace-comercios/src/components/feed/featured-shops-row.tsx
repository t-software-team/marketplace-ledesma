'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ShopCard } from '@/components/shared/shop-card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Comercios</h2>
        <Link href="/comercios" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} className="w-56 shrink-0" />
        ))}
      </div>
    </div>
  )
}
