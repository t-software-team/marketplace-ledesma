import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface LandingBannerData {
  title: string
  subtitle: string | null
  image_url: string | null
  cta_label: string | null
  cta_url: string | null
}

interface LandingServiceData {
  name: string
  description: string
}

function parseBanner(value: unknown): LandingBannerData | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.title !== 'string' || !raw.title) return null
  return {
    title: raw.title,
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : null,
    image_url: typeof raw.image_url === 'string' ? raw.image_url : null,
    cta_label: typeof raw.cta_label === 'string' ? raw.cta_label : null,
    cta_url: typeof raw.cta_url === 'string' ? raw.cta_url : null,
  }
}

function parseServices(value: unknown): LandingServiceData[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .filter((item) => typeof item.name === 'string' && item.name)
    .map((item) => ({
      name: item.name as string,
      description: typeof item.description === 'string' ? item.description : '',
    }))
}

export function LandingBannerSection({ data }: { data: unknown }) {
  const banner = parseBanner(data)
  if (!banner) return null

  if (banner.image_url) {
    return (
      <div className="relative -mx-4 h-52 overflow-hidden rounded-xl sm:h-64 md:-mx-6">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1024px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex items-center gap-1.5 text-white/90">
            <Sparkles className="size-4" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">Novedad</span>
          </div>
          <p className="mt-1 text-xl font-heading text-white sm:text-2xl">{banner.title}</p>
          {banner.subtitle && <p className="mt-0.5 text-sm text-white/80">{banner.subtitle}</p>}
          {banner.cta_label && banner.cta_url && (
            <Link
              href={banner.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {banner.cta_label}
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-4 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-surface to-surface p-5 sm:p-6 md:-mx-6">
      <div className="flex items-center gap-1.5 text-primary">
        <Sparkles className="size-4" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">Novedad</span>
      </div>
      <p className="mt-1 text-lg font-heading">{banner.title}</p>
      {banner.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{banner.subtitle}</p>}
      {banner.cta_label && banner.cta_url && (
        <Link
          href={banner.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {banner.cta_label}
        </Link>
      )}
    </div>
  )
}

export function LandingServicesSection({ data }: { data: unknown }) {
  const services = parseServices(data)
  if (services.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">Servicios</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {services.map((service, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-sm font-medium">{service.name}</p>
            {service.description && (
              <p className="mt-1 text-xs text-muted-foreground">{service.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
