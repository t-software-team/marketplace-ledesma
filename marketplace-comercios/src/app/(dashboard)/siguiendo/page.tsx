import Image from 'next/image'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { BackLink } from '@/components/shared/back-link'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { EmptyState } from '@/components/shared/empty-state'
import { getMyFollowedShops } from '@/lib/shops/queries'
import { hasVerifiedBadge } from '@/lib/shops/badge'

export default async function FollowingPage() {
  const shops = await getMyFollowedShops()

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <BackLink href="/" />
      <h1 className="text-2xl font-heading">Comercios que seguís</h1>

      {shops.length === 0 ? (
        <EmptyState message="Todavía no seguís ningún comercio. Entrá a la ficha de una tienda y tocá 'Seguir' para enterarte de sus novedades." />
      ) : (
        <div className="divide-y divide-border">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/tienda/${shop.slug}`}
              className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:opacity-70"
            >
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
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
                {shop.city && <p className="truncate text-xs text-muted-foreground">{shop.city}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
