import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Clock, Globe, MapPin, Store } from 'lucide-react'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { FacebookIcon } from '@/components/shared/facebook-icon'
import { FollowShopButton } from '@/components/shop/follow-shop-button'
import { ShareButton } from '@/components/shared/share-button'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { StarRating } from '@/components/shared/star-rating'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { ShopProductGrid, type ShopProductItem } from '@/components/shop/shop-product-grid'
import { ShopmoreHeroCarousel } from '@/components/shop/store-templates/shopmore-hero-carousel'
import { parseBanner, parseServices } from '@/components/shop/landing/landing-sections-types'
import { getOpenStatus } from '@/lib/shops/business-hours'

interface ShopmoreTemplateProps {
  shopId: string
  shopName: string
  logoUrl: string | null
  shopUrl: string
  isVerified: boolean
  avgRating: number
  reviewCount: number
  landingBanner: unknown
  landingServices: unknown
  businessHours: unknown
  address: string | null
  city: string | null
  whatsappNumber: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
  initialProducts: ShopProductItem[]
}

/**
 * Plantilla "Tienda online": una portada de ecommerce completa que se apropia de
 * toda la página (barra de tienda, hero, servicios, banda de contacto, catálogo
 * e información). Reemplaza el header genérico de la ficha. Sin carrito — el
 * contacto sale por WhatsApp, coherente con Proxi.
 */
export function ShopmoreTemplate(props: ShopmoreTemplateProps) {
  const {
    shopId,
    shopName,
    logoUrl,
    shopUrl,
    isVerified,
    avgRating,
    reviewCount,
    landingBanner,
    landingServices,
    businessHours,
    address,
    city,
    whatsappNumber,
    instagramUrl,
    facebookUrl,
    websiteUrl,
    initialProducts,
  } = props

  const services = parseServices(landingServices)

  return (
    <div className="space-y-12 sm:space-y-16">
      <StoreBar
        shopId={shopId}
        shopName={shopName}
        logoUrl={logoUrl}
        shopUrl={shopUrl}
        isVerified={isVerified}
        avgRating={avgRating}
        reviewCount={reviewCount}
      />

      <ShopmoreHero
        banner={landingBanner}
        shopName={shopName}
        shopId={shopId}
        whatsappNumber={whatsappNumber}
      />

      {services.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <div key={index} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm leading-snug">{service.name}</p>
                {service.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{service.description}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {whatsappNumber && (
        <ContactBand shopName={shopName} whatsappNumber={whatsappNumber} />
      )}

      <section id="productos" className="scroll-mt-20 space-y-5">
        <SectionHeader title="Todos los productos" />
        <ShopProductGrid shopId={shopId} initialProducts={initialProducts} shopName={shopName} />
      </section>

      <ShopmoreInfo
        businessHours={businessHours}
        address={address}
        city={city}
        instagramUrl={instagramUrl}
        facebookUrl={facebookUrl}
        websiteUrl={websiteUrl}
      />
    </div>
  )
}

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-heading text-2xl sm:text-[1.75rem]">{title}</h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}

function StoreBar({
  shopId,
  shopName,
  logoUrl,
  shopUrl,
  isVerified,
  avgRating,
  reviewCount,
}: {
  shopId: string
  shopName: string
  logoUrl: string | null
  shopUrl: string
  isVerified: boolean
  avgRating: number
  reviewCount: number
}) {
  return (
    <div className="-mx-4 flex items-center justify-between gap-3 px-4 pt-1 pb-1 md:-mx-6 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {logoUrl ? (
            <Image src={logoUrl} alt={`Logo de ${shopName}`} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Store className="size-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="truncate font-heading text-lg">{shopName}</span>
            {isVerified && <VerifiedStamp className="size-4 shrink-0" />}
          </div>
          {reviewCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <StarRating rating={avgRating} starClassName="size-3" />
              {avgRating} ({reviewCount})
            </span>
          )}
        </div>
      </div>

      <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
        <a href="#productos" className="transition-colors hover:text-foreground">Productos</a>
        <a href="#categorias" className="transition-colors hover:text-foreground">Categorías</a>
        <a href="#info" className="transition-colors hover:text-foreground">Información</a>
      </nav>

      <div className="flex shrink-0 items-center gap-1.5">
        <FollowShopButton shopId={shopId} />
        <ShareButton
          title={shopName}
          text={`Mirá ${shopName} en Proxi Marketplace`}
          url={shopUrl}
          size="icon"
        />
      </div>
    </div>
  )
}

function ShopmoreHero({
  banner: rawBanner,
  shopName,
  shopId,
  whatsappNumber,
}: {
  banner: unknown
  shopName: string
  shopId: string
  whatsappNumber: string | null
}) {
  const banner = parseBanner(rawBanner)
  const title = banner.title.trim() || shopName
  const images = banner.images.length > 0 ? banner.images : banner.image_url ? [banner.image_url] : []

  return (
    <section className="-mx-4 md:-mx-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary/12 via-secondary/50 to-surface">
        <div className="grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
            {banner.subtitle && (
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">{banner.subtitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="#productos"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_8px_20px_-8px_var(--primary)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Ver productos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {whatsappNumber && (
                <WhatsAppButton
                  shopId={shopId}
                  phoneNumber={whatsappNumber}
                  message={`Hola ${shopName}, vi tu tienda en Proxi Marketplace`}
                  variant="outline"
                  className="h-auto px-5 py-2.5 text-sm"
                />
              )}
            </div>
          </div>

          {images.length > 0 ? (
            <ShopmoreHeroCarousel images={images} />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-primary/10">
              <Store className="size-16 text-primary/40" aria-hidden />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ContactBand({
  shopName,
  whatsappNumber,
}: {
  shopName: string
  whatsappNumber: string
}) {
  const digits = whatsappNumber.replace(/\D/g, '')
  const message = encodeURIComponent(`Hola ${shopName}, vi tu tienda en Proxi Marketplace`)
  const href = `https://wa.me/${digits}?text=${message}`

  return (
    <section className="-mx-4 md:-mx-6">
      <div className="flex flex-col items-start gap-5 rounded-3xl bg-gradient-to-r from-primary to-[#9a5cf0] px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="space-y-1">
          <h3 className="font-heading text-2xl text-white">¿Buscás algo puntual?</h3>
          <p className="text-sm text-white/80">Escribinos por WhatsApp y te ayudamos a encontrarlo.</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Escribir por WhatsApp
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </section>
  )
}

const HOURS_DAYS: { key: string; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

function formatHoursRange(raw: unknown): string {
  if (typeof raw !== 'string' || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(raw)) return 'Cerrado'
  const [from, to] = raw.split('-')
  return `${from} a ${to}`
}

const WEEKDAY_TO_KEY: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miercoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sabado',
  Sunday: 'domingo',
}

function getTodayKey(): string {
  const weekday = new Date().toLocaleString('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
  })
  return WEEKDAY_TO_KEY[weekday] ?? ''
}

interface ContactRow {
  href: string
  icon: React.ReactNode
  label: string
  detail: string
}

function ShopmoreInfo({
  businessHours,
  address,
  city,
  instagramUrl,
  facebookUrl,
  websiteUrl,
}: {
  businessHours: unknown
  address: string | null
  city: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
}) {
  const schedule =
    businessHours && typeof businessHours === 'object'
      ? (businessHours as Record<string, unknown>)
      : null
  const hasHours = schedule ? HOURS_DAYS.some((day) => typeof schedule[day.key] === 'string') : false
  const openStatus = getOpenStatus(businessHours)
  const todayKey = getTodayKey()
  const locationText = [address, city].filter(Boolean).join(', ')

  const contactRows: ContactRow[] = []
  if (locationText) {
    contactRows.push({
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`,
      icon: <MapPin className="size-4" aria-hidden />,
      label: 'Dirección',
      detail: locationText,
    })
  }
  if (instagramUrl) {
    contactRows.push({ href: instagramUrl, icon: <InstagramIcon className="size-4" />, label: 'Instagram', detail: 'Ver perfil' })
  }
  if (facebookUrl) {
    contactRows.push({ href: facebookUrl, icon: <FacebookIcon className="size-4" />, label: 'Facebook', detail: 'Ver página' })
  }
  if (websiteUrl) {
    contactRows.push({ href: websiteUrl, icon: <Globe className="size-4" aria-hidden />, label: 'Sitio web', detail: 'Visitar' })
  }

  if (!hasHours && contactRows.length === 0) return null

  return (
    <section id="info" className="scroll-mt-20 space-y-5">
      <SectionHeader title="Información" />
      <div className="grid gap-4 lg:grid-cols-2">
        {hasHours && schedule && (
          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-heading">
                <Clock className="size-4 text-primary" aria-hidden />
                Horarios
              </div>
              {openStatus && (
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    openStatus.isOpen
                      ? 'bg-success/40 text-success-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${openStatus.isOpen ? 'bg-success-foreground' : 'bg-muted-foreground'}`}
                    aria-hidden
                  />
                  {openStatus.isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
                </span>
              )}
            </div>
            <ul className="text-sm">
              {HOURS_DAYS.map((day) => {
                const isToday = day.key === todayKey
                return (
                  <li
                    key={day.key}
                    className={`flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-0 ${
                      isToday ? 'text-foreground' : ''
                    }`}
                  >
                    <span className={isToday ? 'font-medium' : 'text-muted-foreground'}>
                      {day.label}
                      {isToday && <span className="ml-1.5 text-xs text-primary">· hoy</span>}
                    </span>
                    <span className={isToday ? 'font-semibold' : 'font-medium'}>
                      {formatHoursRange(schedule[day.key])}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {contactRows.length > 0 && (
          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="mb-4 font-heading">Contacto</div>
            <ul className="space-y-1">
              {contactRows.map((row) => (
                <li key={row.label}>
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {row.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{row.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
