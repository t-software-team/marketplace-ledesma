import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowLeft, MapPin, Store } from 'lucide-react'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { FacebookIcon } from '@/components/shared/facebook-icon'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { FeaturedRibbon } from '@/components/shared/featured-ribbon'
import { StarRating } from '@/components/shared/star-rating'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { FollowShopButton } from '@/components/shop/follow-shop-button'
import { LandingBannerSection, LandingGallerySection, LandingServicesSection } from '@/components/shop/landing-sections'
import { LandingVideoSection } from '@/components/shop/landing-video-section'
import { OpenNowBadge } from '@/components/shop/open-now-badge'
import { RelatedShops } from '@/components/shop/related-shops'
import { ReportShopDialog } from '@/components/shop/report-shop-dialog'
import { ShareButton } from '@/components/shared/share-button'
import { ShopProductGrid } from '@/components/shop/shop-product-grid'
import { ShopServiceList } from '@/components/shop/shop-service-list'
import { BookingSection } from '@/components/turnos/booking-section'
import { getPublicBookingSettings } from '@/lib/turnos/queries'
import { ShopQrDialog } from '@/components/shop/shop-qr-dialog'
import { ShopMoreLinksMenu } from '@/components/shop/shop-more-links-menu'
import { ExpandableDescription } from '@/components/shop/expandable-description'
import Link from 'next/link'
import { ShopReviewDialog } from '@/components/shop/shop-review-dialog'
import { ShopReviewsList } from '@/components/shop/shop-reviews-list'
import { ShopViewTracker } from '@/components/shop/shop-view-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getMyShopFollow,
  getMyShopReview,
  getRelatedShops,
  getShopBySlug,
  getShopFollowStats,
  getShopProducts,
  getShopRating,
  getShopReviews,
} from '@/lib/shops/queries'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { createClient } from '@/lib/supabase/server'
import { getAccentColor } from '@/lib/accent-colors'
import { getBaseUrl } from '@/lib/site-url'
import { cn } from '@/lib/utils'
import { stripHtml } from '@/lib/strip-html'

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

  const description = shop.description
    ? stripHtml(shop.description)
    : `Productos de ${shop.name} en Proxi Marketplace`

  return {
    title: shop.name,
    description,
    openGraph: {
      title: shop.name,
      description,
      images: shop.logo_url ? [{ url: shop.logo_url }] : undefined,
    },
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const [shop, {
    data: { user },
  }] = await Promise.all([getShopBySlug(slug), supabase.auth.getUser()])

  if (!shop) {
    notFound()
  }

  const [products, shopUrl, rating, reviews, myReview, followerCount, isFollowing, relatedShops] =
    await Promise.all([
      getShopProducts(shop.id),
      getShopUrl(slug),
      getShopRating(shop.id),
      getShopReviews(shop.id),
      user ? getMyShopReview(shop.id) : Promise.resolve(null),
      getShopFollowStats(shop.id),
      user ? getMyShopFollow(shop.id) : Promise.resolve(false),
      getRelatedShops(shop.id, shop.category_id, shop.city),
    ])
  const mapsUrl = getMapsUrl(shop.address, shop.city)
  const categoryName = shop.categories?.name ?? null
  const isService = shop.categories?.is_service ?? false
  const isVerified = hasVerifiedBadge(shop)
  const isFeatured = shop.subscription_status === 'active'
  const baseUrl = getBaseUrl()
  const accentColor = shop.accent_color ? getAccentColor(shop.accent_color) : null
  const themeClass = accentColor ? `shop-theme-${shop.id}` : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    description: shop.description ? stripHtml(shop.description) : undefined,
    image: shop.logo_url ?? undefined,
    url: `${baseUrl}/tienda/${shop.slug}`,
    address: shop.city
      ? { '@type': 'PostalAddress', addressLocality: shop.city, streetAddress: shop.address ?? undefined }
      : undefined,
    aggregateRating:
      rating.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: rating.avgRating,
            reviewCount: rating.reviewCount,
          }
        : undefined,
  }

  return (
    <div className={cn('-mt-5 space-y-6 pb-24 sm:mt-0', themeClass)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {accentColor && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .${themeClass} { --primary: ${accentColor.light.primary}; --primary-foreground: ${accentColor.light.primaryForeground}; }
              .dark .${themeClass} { --primary: ${accentColor.dark.primary}; --primary-foreground: ${accentColor.dark.primaryForeground}; }
            `,
          }}
        />
      )}
      <ShopViewTracker shopId={shop.id} />

      <div className="-mx-4 overflow-hidden rounded-xl bg-surface md:-mx-6">
        <div className="relative h-28 bg-muted md:h-36">
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
            <div className="h-full bg-background" />
          )}
          <Link
            href="/"
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Ir al Marketplace
          </Link>
          {isFeatured && <FeaturedRibbon variant="floating" />}
        </div>

        <div className="relative px-4 pb-5 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative -mt-8 size-16 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-muted md:size-20">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt={`Logo de ${shop.name}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Store className="size-6" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="truncate text-2xl font-heading">{shop.name}</h1>
                    {isVerified && <VerifiedStamp className="size-5 shrink-0" />}
                  </div>
                </div>
                <FollowShopButton
                  shopId={shop.id}
                  isLoggedIn={Boolean(user)}
                  initialIsFollowing={isFollowing}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                {isFeatured && rating.reviewCount > 0 && (
                  <span className="flex shrink-0 items-center gap-1">
                    <StarRating rating={rating.avgRating} />
                    <span>
                      {rating.avgRating} ({rating.reviewCount})
                    </span>
                  </span>
                )}
                {isFeatured && rating.reviewCount > 0 && followerCount > 0 && <span aria-hidden>·</span>}
                {followerCount > 0 && (
                  <span className="shrink-0">
                    {followerCount} {followerCount === 1 ? 'seguidor' : 'seguidores'}
                  </span>
                )}
                {((isFeatured && rating.reviewCount > 0) || followerCount > 0) && categoryName && (
                  <span aria-hidden>·</span>
                )}
                {categoryName && (
                  <Badge variant="outline" className="shrink-0 font-normal">
                    {categoryName}
                  </Badge>
                )}
                {shop.city && (
                  <span className="flex shrink-0 items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {shop.city}
                  </span>
                )}
                <OpenNowBadge businessHours={shop.business_hours} />
              </div>
            </div>
          </div>

          {shop.is_paused && (
            <Badge variant="outline" className="mt-3 border-warning bg-warning/30 text-warning-foreground">
              Tienda en pausa{shop.paused_reason ? `: ${shop.paused_reason}` : ''}
            </Badge>
          )}

          {shop.description && <ExpandableDescription html={shop.description} />}

          <div className="mt-4 hidden items-center gap-2 sm:flex">
            <WhatsAppButton
              shopId={shop.id}
              phoneNumber={shop.whatsapp_number}
              message={`Hola ${shop.name}, vi tu tienda en Proxi Marketplace`}
              className="max-w-xs flex-1"
            />
            {mapsUrl && (
              <Button
                variant="outline"
                size="icon"
                render={<a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver en mapa" />}
                nativeButton={false}
              >
                <MapPin className="size-4" />
              </Button>
            )}
            <ShopMoreLinksMenu
              instagramUrl={shop.instagram_url}
              facebookUrl={shop.facebook_url}
              websiteUrl={shop.website_url}
            />
            <ShopQrDialog shopName={shop.name} shopUrl={shopUrl} triggerVariant="icon" />
            <ShareButton
              title={shop.name}
              text={`Mirá ${shop.name} en Proxi Marketplace`}
              url={shopUrl}
              size="icon"
            />
          </div>
        </div>
      </div>

      <LandingBannerSection data={shop.landing_banner} />

      <LandingServicesSection data={shop.landing_services} />
      <LandingGallerySection data={shop.landing_gallery} />
      <LandingVideoSection url={shop.landing_video_url} />

      <section className="space-y-4">
        <h2 className="text-lg font-heading">{isService ? 'Servicios' : 'Productos'}</h2>
        {isService ? (
          <ShopServiceList
            shopId={shop.id}
            initialProducts={products}
            shopName={shop.name}
            whatsappNumber={shop.whatsapp_number}
          />
        ) : (
          <ShopProductGrid shopId={shop.id} initialProducts={products} shopName={shop.name} />
        )}
      </section>

      {isService && (await getPublicBookingSettings(shop.id))?.is_enabled && (
        <section className="space-y-4">
          <h2 className="text-lg font-heading">Turnos</h2>
          <BookingSection shopId={shop.id} />
        </section>
      )}

      {isFeatured && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-heading">
              Reseñas {rating.reviewCount > 0 && `(${rating.reviewCount})`}
            </h2>
            {user ? (
              <ShopReviewDialog shopId={shop.id} myReview={myReview} />
            ) : (
              <Button
                render={<Link href={`/login?next=/tienda/${slug}`} />}
                nativeButton={false}
                variant="outline"
                size="sm"
              >
                Iniciar sesión para dejar una reseña
              </Button>
            )}
          </div>
          <ShopReviewsList reviews={reviews} />
        </section>
      )}

      <RelatedShops shops={relatedShops} />

      <div className="flex justify-center">
        <ReportShopDialog shopId={shop.id} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-background/95 p-4 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-5xl gap-2">
          <WhatsAppButton
            shopId={shop.id}
            phoneNumber={shop.whatsapp_number}
            message={`Hola ${shop.name}, vi tu tienda en Proxi Marketplace`}
            className="flex-1"
          />
          {shop.instagram_url && (
            <Button
              variant="ghost"
              size="icon"
              render={
                <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Ver Instagram" />
              }
              nativeButton={false}
            >
              <InstagramIcon className="size-4" />
            </Button>
          )}
          {shop.facebook_url && (
            <Button
              variant="ghost"
              size="icon"
              render={
                <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Ver Facebook" />
              }
              nativeButton={false}
            >
              <FacebookIcon className="size-4" />
            </Button>
          )}
          <ShareButton
            title={shop.name}
            text={`Mirá ${shop.name} en Proxi Marketplace`}
            url={shopUrl}
            size="icon"
          />
        </div>
      </div>
    </div>
  )
}
