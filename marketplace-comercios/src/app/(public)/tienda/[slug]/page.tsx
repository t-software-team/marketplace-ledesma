import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { FeaturedRibbon } from '@/components/shared/featured-ribbon'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { ShopProductGrid } from '@/components/shop/shop-product-grid'
import { ShopQrDialog } from '@/components/shop/shop-qr-dialog'
import { ShopViewTracker } from '@/components/shop/shop-view-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getShopBySlug, getShopProducts } from '@/lib/shops/queries'

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

function getShopUrl(slug: string) {
  return headers().then((headersList) => {
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') ?? 'http'
    return `${protocol}://${host}/tienda/${slug}`
  })
}

function getMapsUrl(address: string | null, city: string | null) {
  const query = [address, city].filter(Boolean).join(', ')
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    return { title: 'Tienda no encontrada' }
  }

  return {
    title: `${shop.name} | Marketplace Ledesma`,
    description: shop.description ?? `Productos de ${shop.name} en Marketplace Ledesma`,
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    notFound()
  }

  const products = await getShopProducts(shop.id)
  const shopUrl = await getShopUrl(slug)
  const mapsUrl = getMapsUrl(shop.address, shop.city)
  const categoryName = shop.categories?.name ?? null
  const isVerified = shop.verification_status === 'verified'
  const isFeatured = shop.subscription_status === 'active'
  const locationLabel = [categoryName, shop.city].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6 pb-24">
      <ShopViewTracker shopId={shop.id} />

      <div className="-mx-4 overflow-hidden rounded-xl border border-border bg-surface md:-mx-6">
        <div className="relative h-36 bg-muted md:h-44">
          {shop.cover_url ? (
            <Image
              src={shop.cover_url}
              alt={`Portada de ${shop.name}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          {isFeatured && <FeaturedRibbon className="rounded-none" />}
        </div>

        <div className="relative px-4 pb-5 md:px-6">
          <div className="flex items-end gap-3">
            <div className="relative -mt-8 size-16 shrink-0 overflow-hidden rounded-xl border-2 border-surface bg-muted ring-1 ring-border">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt={`Logo de ${shop.name}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-heading text-muted-foreground">
                  {shop.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-2">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-heading">{shop.name}</h1>
                {isVerified && <VerifiedStamp className="size-7 shrink-0" />}
              </div>
              {locationLabel && (
                <p className="mt-0.5 text-sm text-muted-foreground">{locationLabel}</p>
              )}
            </div>
          </div>

          {shop.is_paused && (
            <Badge variant="outline" className="mt-3 border-warning bg-warning/30 text-warning-foreground">
              Tienda en pausa{shop.paused_reason ? `: ${shop.paused_reason}` : ''}
            </Badge>
          )}

          {shop.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {shop.description}
            </p>
          )}

          <div className="mt-4 hidden gap-2 sm:flex">
            <WhatsAppButton
              shopId={shop.id}
              phoneNumber={shop.whatsapp_number}
              message={`Hola ${shop.name}, vi tu tienda en Marketplace Ledesma`}
              className="max-w-xs"
            />
            {mapsUrl && (
              <Button
                variant="outline"
                className="gap-2"
                render={
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" />
                }
                nativeButton={false}
              >
                <MapPin className="size-4" />
                Ver en mapa
              </Button>
            )}
            <ShopQrDialog shopName={shop.name} shopUrl={shopUrl} />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-heading">Productos</h2>
        <ShopProductGrid products={products} shopName={shop.name} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-5xl gap-2">
          <WhatsAppButton
            shopId={shop.id}
            phoneNumber={shop.whatsapp_number}
            message={`Hola ${shop.name}, vi tu tienda en Marketplace Ledesma`}
            className="flex-1"
          />
          {mapsUrl && (
            <Button
              variant="outline"
              size="icon"
              render={
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver en mapa"
                />
              }
              nativeButton={false}
            >
              <MapPin className="size-4" />
            </Button>
          )}
          <ShopQrDialog shopName={shop.name} shopUrl={shopUrl} />
        </div>
      </div>
    </div>
  )
}
