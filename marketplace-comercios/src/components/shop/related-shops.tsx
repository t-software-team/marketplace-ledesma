import Image from 'next/image'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { VerifiedStamp } from '@/components/shared/verified-stamp'

interface RelatedShop {
  id: string
  name: string
  slug: string
  logo_url: string | null
  city: string | null
  verification_status: string
}

interface RelatedShopsProps {
  shops: RelatedShop[]
}

export function RelatedShops({ shops }: RelatedShopsProps) {
  if (shops.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">Otros comercios que te pueden interesar</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {shops.map((shop) => (
          <Link
            key={shop.id}
            href={`/tienda/${shop.slug}`}
            className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center transition-colors hover:border-primary"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
              {shop.logo_url ? (
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Store className="size-5" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-center gap-1">
                <p className="truncate text-sm font-medium">{shop.name}</p>
                {shop.verification_status === 'verified' && <VerifiedStamp className="size-3.5 shrink-0" />}
              </div>
              {shop.city && <p className="truncate text-xs text-muted-foreground">{shop.city}</p>}
            </div>
          </Link>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Descubrí más comercios como este en Proxi Marketplace
      </p>
    </section>
  )
}
