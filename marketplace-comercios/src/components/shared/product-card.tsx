import Link from 'next/link'
import Image from 'next/image'
import { FeaturedRibbon } from '@/components/shared/featured-ribbon'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ProductFeedItem {
  product_id: string
  product_name: string
  price: number | null
  shop_id: string
  shop_name: string
  shop_is_featured: boolean
  distance_km: number | null
  main_image: string | null
}

interface ProductCardProps {
  product: ProductFeedItem
  isVerified?: boolean
  className?: string
}

function formatPrice(price: number | null) {
  if (price == null) return 'Consultar'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDistance(distanceKm: number | null) {
  if (distanceKm == null) return null
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  return `${distanceKm.toFixed(1)} km`
}

export function ProductCard({ product, isVerified = false, className }: ProductCardProps) {
  const distance = formatDistance(product.distance_km)

  return (
    <Link href={`/producto/${product.product_id}`} className={cn('block', className)}>
      <Card className="relative overflow-hidden py-0 ring-border/60 transition-colors hover:ring-primary/30">
        {product.shop_is_featured && <FeaturedRibbon />}
        <div className="relative aspect-square bg-muted">
          {product.main_image ? (
            <Image
              src={product.main_image}
              alt={product.product_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}
          {isVerified && (
            <div className="absolute right-2 bottom-2">
              <VerifiedStamp />
            </div>
          )}
        </div>
        <CardContent className="space-y-1 pb-4">
          <p className="line-clamp-2 font-medium leading-snug">{product.product_name}</p>
          <p className="font-mono text-sm text-foreground">{formatPrice(product.price)}</p>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{product.shop_name}</span>
            {distance && <span className="shrink-0 font-mono">{distance}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
