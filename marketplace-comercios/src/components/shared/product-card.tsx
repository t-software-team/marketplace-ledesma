import Link from 'next/link'
import Image from 'next/image'
import { FavoriteButton } from '@/components/shared/favorite-button'
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
  category_name?: string | null
  parent_category_name?: string | null
}

interface ProductCardProps {
  product: ProductFeedItem
  isVerified?: boolean
  className?: string
  isLoggedIn?: boolean
  initialIsFavorite?: boolean
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

export function ProductCard({
  product,
  isVerified = false,
  className,
  isLoggedIn = false,
  initialIsFavorite = false,
}: ProductCardProps) {
  const distance = formatDistance(product.distance_km)
  const categoryBreadcrumb = product.category_name
    ? product.parent_category_name
      ? `${product.parent_category_name} › ${product.category_name}`
      : product.category_name
    : null

  return (
    <Link href={`/producto/${product.product_id}`} className={cn('block', className)}>
      <Card className="relative overflow-hidden py-0 ring-border/60 transition-colors hover:ring-primary/30">
        {product.shop_is_featured && <FeaturedRibbon />}
        <FavoriteButton
          productId={product.product_id}
          initialIsFavorite={initialIsFavorite}
          isLoggedIn={isLoggedIn}
          className="absolute top-2 right-2 z-10"
        />
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
          {categoryBreadcrumb && (
            <p className="truncate text-[11px] text-muted-foreground">{categoryBreadcrumb}</p>
          )}
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
