import Image from 'next/image'
import Link from 'next/link'
import { createElement } from 'react'
import { Clock, Globe, MapPin } from 'lucide-react'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { FacebookIcon } from '@/components/shared/facebook-icon'
import { LandingServicesSection } from '@/components/shop/landing-sections'
import { ExpandableDescription } from '@/components/shop/expandable-description'
import { ShopProductGrid, type ShopProductItem } from '@/components/shop/shop-product-grid'
import { ShopmoreFeatured } from '@/components/shop/store-templates/shopmore-featured'
import { parseBanner } from '@/components/shop/landing/landing-sections-types'
import { getRubroIcon } from '@/lib/category-icons'

interface FeaturedProduct {
  id: string
  name: string
  price: number | null
  currency: string
  main_image: string | null
}

interface ShopCategory {
  id: string
  name: string
  slug: string
}

interface ShopmoreTemplateProps {
  shopId: string
  shopName: string
  landingBanner: unknown
  landingServices: unknown
  description: string | null
  businessHours: unknown
  address: string | null
  city: string | null
  whatsappNumber: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
  initialProducts: ShopProductItem[]
  featured: FeaturedProduct[]
  categories: ShopCategory[]
}

/**
 * Plantilla "Marketplace": replica el diseño tipo tienda online (hero,
 * categorías, destacados, grilla) y suma secciones de información del comercio
 * (servicios, sobre la tienda, horarios y contacto). Sin carrito. El contenido
 * lo carga el comercio y reutiliza columnas existentes (landing_banner,
 * landing_services, description, business_hours, datos de contacto).
 */
export function ShopmoreTemplate({
  shopId,
  shopName,
  landingBanner,
  landingServices,
  description,
  businessHours,
  address,
  city,
  whatsappNumber,
  instagramUrl,
  facebookUrl,
  websiteUrl,
  initialProducts,
  featured,
  categories,
}: ShopmoreTemplateProps) {
  return (
    <div className="space-y-8">
      <ShopmoreHero banner={landingBanner} />

      {categories.length > 0 && <ShopmoreCategories categories={categories} />}

      <ShopmoreFeatured title="Destacados" products={featured} />

      <section id="productos" className="scroll-mt-20 space-y-4">
        <h2 className="text-lg font-heading">Todos los productos</h2>
        <ShopProductGrid shopId={shopId} initialProducts={initialProducts} shopName={shopName} />
      </section>

      <LandingServicesSection data={landingServices} />

      {description && (
        <section className="space-y-2">
          <h2 className="text-lg font-heading">Sobre {shopName}</h2>
          <ExpandableDescription html={description} />
        </section>
      )}

      <ShopmoreContact
        businessHours={businessHours}
        address={address}
        city={city}
        whatsappNumber={whatsappNumber}
        instagramUrl={instagramUrl}
        facebookUrl={facebookUrl}
        websiteUrl={websiteUrl}
      />
    </div>
  )
}

function ShopmoreHero({ banner: rawBanner }: { banner: unknown }) {
  const banner = parseBanner(rawBanner)
  if (!banner.title.trim()) return null

  const image = banner.images[0] || banner.image_url || null
  const ctaLabel = banner.cta_label?.trim() || 'Ver productos'
  const ctaHref = banner.cta_url?.trim() || '#productos'

  return (
    <div className="relative -mx-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-surface p-6 sm:p-8 md:-mx-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Novedades</p>
          <h2 className="mt-1 font-heading text-2xl leading-tight sm:text-3xl">{banner.title}</h2>
          {banner.subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{banner.subtitle}</p>
          )}
          <Link
            href={ctaHref}
            className="mt-4 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {ctaLabel}
          </Link>
        </div>
        {image && (
          <div className="relative hidden size-32 shrink-0 overflow-hidden rounded-xl sm:block sm:size-40">
            <Image src={image} alt="" fill className="object-cover" sizes="160px" priority />
          </div>
        )}
      </div>
    </div>
  )
}

// Paleta pastel para los círculos de categoría, replicando la variedad de
// colores del diseño de referencia. Se cicla por índice.
const CATEGORY_SWATCHES = [
  'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
  'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
]

function ShopmoreCategories({ categories }: { categories: ShopCategory[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">Categorías</h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        {categories.map((category, index) => (
          <div key={category.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
            <span
              className={`flex size-14 items-center justify-center rounded-full ${CATEGORY_SWATCHES[index % CATEGORY_SWATCHES.length]}`}
            >
              {createElement(getRubroIcon(category.slug), { className: 'size-6', 'aria-hidden': true })}
            </span>
            <span className="line-clamp-2 text-xs font-medium leading-tight text-muted-foreground">
              {category.name}
            </span>
          </div>
        ))}
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

function ShopmoreContact({
  businessHours,
  address,
  city,
  whatsappNumber,
  instagramUrl,
  facebookUrl,
  websiteUrl,
}: {
  businessHours: unknown
  address: string | null
  city: string | null
  whatsappNumber: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
}) {
  const schedule =
    businessHours && typeof businessHours === 'object'
      ? (businessHours as Record<string, unknown>)
      : null
  const hasHours = schedule ? HOURS_DAYS.some((day) => typeof schedule[day.key] === 'string') : false
  const locationText = [address, city].filter(Boolean).join(', ')
  const mapsUrl = locationText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`
    : null
  const hasContact = Boolean(whatsappNumber || instagramUrl || facebookUrl || websiteUrl || locationText)

  if (!hasHours && !hasContact) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">Información</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {hasHours && schedule && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Clock className="size-4 text-primary" aria-hidden />
              Horarios
            </div>
            <ul className="space-y-1 text-sm">
              {HOURS_DAYS.map((day) => (
                <li key={day.key} className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{day.label}</span>
                  <span className="font-medium">{formatHoursRange(schedule[day.key])}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasContact && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-sm font-medium">Contacto</div>
            <ul className="space-y-2 text-sm">
              {locationText && (
                <li>
                  <a
                    href={mapsUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                    {locationText}
                  </a>
                </li>
              )}
              {instagramUrl && (
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <InstagramIcon className="size-4 shrink-0" />
                    Instagram
                  </a>
                </li>
              )}
              {facebookUrl && (
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <FacebookIcon className="size-4 shrink-0" />
                    Facebook
                  </a>
                </li>
              )}
              {websiteUrl && (
                <li>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Globe className="size-4 shrink-0 text-primary" aria-hidden />
                    Sitio web
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
