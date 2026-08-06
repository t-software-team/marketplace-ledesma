import Link from 'next/link'
import Image from 'next/image'
import { createElement } from 'react'
import { MapPin } from 'lucide-react'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { FeaturedRibbon } from '@/components/shared/featured-ribbon'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { Card, CardContent } from '@/components/ui/card'
import { getRubroIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

export interface ProductFeedItem {
  product_id: string
  product_name: string
  price: number | null
  shop_id: string
  shop_name: string
  shop_is_featured: boolean
  shop_is_verified?: boolean
  product_is_featured?: boolean
  distance_km: number | null
  main_image: string | null
  category_name?: string | null
  parent_category_name?: string | null
  attributes?: unknown
  rubro_slug?: string | null
  is_service?: boolean | null
}

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i

function ShopRubroIcon({ rubroSlug, className }: { rubroSlug?: string | null; className?: string }) {
  return createElement(getRubroIcon(rubroSlug ?? ''), { className, 'aria-hidden': true })
}

interface ProductCardProps {
  product: ProductFeedItem
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
  className,
  isLoggedIn = false,
  initialIsFavorite = false,
}: ProductCardProps) {
  const isVerified = Boolean(product.shop_is_verified)
  const distance = formatDistance(product.distance_km)
  const categoryBreadcrumb = product.category_name
    ? product.parent_category_name
      ? `${product.parent_category_name} › ${product.category_name}`
      : product.category_name
    : null

  const isFeatured = Boolean(product.product_is_featured)
  const attributeBadges = Array.isArray(product.attributes)
    ? (product.attributes as unknown[]).filter((v): v is string => typeof v === 'string')
    : []

  return (
    <Link href={`/producto/${product.product_id}`} className={cn('block', className)}>
      <Card
        className={cn(
          'relative overflow-hidden py-0 shadow-none ring-0 transition-opacity duration-200 hover:opacity-80',
          isFeatured && 'ring-1 ring-primary/40'
        )}
      >
        {isFeatured && <FeaturedRibbon variant="floating" />}
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
        </div>
        <CardContent className="space-y-1.5 pb-4">
          <div className="flex items-center justify-between gap-2">
            {categoryBreadcrumb && (
              <p className="truncate text-[11px] font-medium tracking-wide text-primary uppercase">
                {categoryBreadcrumb}
              </p>
            )}
            {product.is_service && (
              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                Servicio
              </span>
            )}
          </div>
          <p className="line-clamp-2 font-medium leading-snug">{product.product_name}</p>
          <p className="font-mono text-base font-semibold text-foreground">
            {formatPrice(product.price)}
          </p>
          {attributeBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {attributeBadges.slice(0, 4).map((value) =>
                HEX_COLOR_REGEX.test(value) ? (
                  <span
                    key={value}
                    style={{ backgroundColor: value }}
                    className="size-3 rounded-full ring-1 ring-border"
                  />
                ) : (
                  <span
                    key={value}
                    className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {value}
                  </span>
                )
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1">
              <ShopRubroIcon rubroSlug={product.rubro_slug} className="size-3 shrink-0" />
              <span className="truncate">{product.shop_name}</span>
              {isVerified && <VerifiedStamp className="size-3.5 shrink-0" />}
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
