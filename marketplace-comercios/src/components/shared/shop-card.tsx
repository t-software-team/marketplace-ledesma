import Image from 'next/image'
import Link from 'next/link'
import { Star, Store } from 'lucide-react'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { cn } from '@/lib/utils'
import type { FeaturedShop } from '@/hooks/use-products'

interface ShopCardProps {
  shop: FeaturedShop
  className?: string
}

export function ShopCard({ shop, className }: ShopCardProps) {
  return (
    <Link
      href={`/tienda/${shop.slug}`}
      className={cn(
        'flex items-center gap-3 rounded-xl bg-surface p-3 transition-opacity hover:opacity-70',
        className
      )}
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
  )
}
