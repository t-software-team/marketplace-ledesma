import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Store } from 'lucide-react'
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
      <Card className="relative overflow-hidden py-0 shadow-sm ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40">
        {product.shop_is_featured && <FeaturedRibbon />}
        <FavoriteButton
          productId={product.product_id}
          initialIsFavorite={initialIsFavorite}
          isLoggedIn={isLoggedIn}
          className="absolute top-2 right-2 z-10"
        />
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.main_image ? (
            <Image
              src={product.main_image}
              alt={product.product_name}
              fill
              className="object-cover transition-transform duration-500 group-hover/card:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" />
          {isVerified && (
            <div className="absolute right-2 bottom-2">
              <VerifiedStamp />
            </div>
          )}
        </div>
        <CardContent className="space-y-1.5 pb-4">
          {categoryBreadcrumb && (
            <p className="truncate text-[11px] font-medium tracking-wide text-primary uppercase">
              {categoryBreadcrumb}
            </p>
          )}
          <p className="line-clamp-2 font-medium leading-snug">{product.product_name}</p>
          <p className="font-mono text-base font-semibold text-foreground">
            {formatPrice(product.price)}
          </p>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1">
              <Store className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{product.shop_name}</span>
            </span>
            {distance && (
              <span className="flex shrink-0 items-center gap-0.5 font-mono">
                <MapPin className="size-3" aria-hidden />
                {distance}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
