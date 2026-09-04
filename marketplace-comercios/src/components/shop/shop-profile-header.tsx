import Image from 'next/image'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShopQrDialog } from '@/components/shop/shop-qr-dialog'
import { ShareButton } from '@/components/shared/share-button'
import { StatusBadge } from '@/components/shared/status-badge'
import { VerifiedStamp } from '@/components/shared/verified-stamp'

interface ShopProfileHeaderProps {
  shopName: string
  logoUrl?: string | null
  coverUrl?: string | null
  shopSlug: string
  shopUrl: string
  isVerified: boolean
  verificationStatus: string
  isPaused: boolean
  pausedReason?: string | null
  titleAs?: 'h1' | 'h2'
}

/** Cover + avatar + status + share actions for a shop's public profile.
 * Shared by the generic dashboard and the per-rubro resúmenes (vet, gym)
 * so the header only needs to change in one place. */
export function ShopProfileHeader({
  shopName,
  logoUrl,
  coverUrl,
  shopSlug,
  shopUrl,
  isVerified,
  verificationStatus,
  isPaused,
  pausedReason,
  titleAs: Title = 'h1',
}: ShopProfileHeaderProps) {
  return (
    <>
      <div className="relative h-28 bg-gradient-to-br from-primary/30 to-destacado/30 sm:h-36">
        {coverUrl && (
          <Image src={coverUrl} alt={`Portada de ${shopName}`} fill className="object-cover" sizes="768px" />
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4">
        <div className="flex items-end gap-3">
          <div className="relative -mt-8 size-16 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-muted sm:size-20">
            {logoUrl ? (
              <Image src={logoUrl} alt={shopName} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Store className="size-6" aria-hidden />
              </div>
            )}
          </div>
          <div className="pb-0.5">
            <div className="flex items-center gap-1.5">
              <Title className="text-xl font-heading sm:text-2xl">{shopName}</Title>
              {isVerified && <VerifiedStamp className="size-6" />}
            </div>
            {isPaused ? (
              <Badge variant="warning" className="mt-1">
                En pausa{pausedReason ? `: ${pausedReason}` : ''}
              </Badge>
            ) : (
              <StatusBadge status={verificationStatus} className="mt-1" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <ShopQrDialog shopName={shopName} shopUrl={shopUrl} triggerVariant="icon" />
          <ShareButton
            title={shopName}
            text={`Mirá ${shopName} en Proxi Marketplace`}
            url={shopUrl}
            variant="outline"
            size="icon"
          />
          <Button
            render={<Link href={`/tienda/${shopSlug}`} target="_blank" />}
            nativeButton={false}
            variant="outline"
            className="gap-1.5"
          >
            Ver tienda pública
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 md:px-6">
        <ShareButton
          title={shopName}
          text={`¿Nos regalás una reseña en Proxi? Contanos cómo te fue con ${shopName}:`}
          url={shopUrl}
          variant="ghost"
          size="sm"
          icon="star"
          label="Invitar a reseñar"
          copiedLabel="Link copiado"
          className="w-full justify-center sm:w-auto"
        />
      </div>
    </>
  )
}
