'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface LandingBannerData {
  title: string
  subtitle: string | null
  image_url: string | null
  images: string[]
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

  const image_url = typeof raw.image_url === 'string' ? raw.image_url : null
  let images = Array.isArray(raw.images)
    ? raw.images.filter((item): item is string => typeof item === 'string').slice(0, 6)
    : []
  if (images.length === 0 && image_url) {
    images = [image_url]
  }

  return {
    title: raw.title,
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : null,
    image_url,
    images,
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

function parseGallery(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').slice(0, 8)
}

function BannerOverlay({ banner }: { banner: LandingBannerData }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
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
  )
}

function BannerCarousel({ banner }: { banner: LandingBannerData }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideCount = banner.images.length

  useEffect(() => {
    const interval = setInterval(() => {
      const container = containerRef.current
      if (!container) return
      const nextIndex = (Math.round(container.scrollLeft / container.clientWidth) + 1) % slideCount
      container.scrollTo({ left: nextIndex * container.clientWidth, behavior: 'smooth' })
    }, 5000)
    return () => clearInterval(interval)
  }, [slideCount])

  function handleScroll() {
    const container = containerRef.current
    if (!container) return
    const index = Math.round(container.scrollLeft / container.clientWidth)
    setActiveIndex(index)
  }

  return (
    <div className="relative -mx-4 h-52 overflow-hidden rounded-xl sm:h-64 md:-mx-6">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {banner.images.map((image, index) => (
          <div key={index} className="relative h-52 w-full shrink-0 snap-center sm:h-64">
            <Image
              src={image}
              alt={banner.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1024px"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <BannerOverlay banner={banner} />
      <div className="absolute inset-x-0 top-3 z-10 flex items-center justify-center gap-1.5">
        {banner.images.map((_, index) => (
          <span
            key={index}
            className={`size-1.5 rounded-full transition-all ${
              index === activeIndex ? 'w-4 bg-white' : 'bg-white/50'
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  )
}

export function LandingBannerSection({ data }: { data: unknown }) {
  const banner = parseBanner(data)
  if (!banner) return null

  if (banner.images.length > 1) {
    return <BannerCarousel banner={banner} />
  }

  if (banner.images[0]) {
    return (
      <div className="relative -mx-4 h-52 overflow-hidden rounded-xl sm:h-64 md:-mx-6">
        <Image
          src={banner.images[0]}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1024px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <BannerOverlay banner={banner} />
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
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-primary/5 transition-colors group-hover:bg-primary/10" aria-hidden />
            <p className="relative text-sm font-medium leading-tight">{service.name}</p>
            {service.description && (
              <p className="relative mt-1 text-xs text-muted-foreground">{service.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function LandingGallerySection({ data }: { data: unknown }) {
  const gallery = parseGallery(data)
  if (gallery.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">Galería</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {gallery.map((image, index) => (
          <a
            key={index}
            href={image}
            target="_blank"
            rel="noopener noreferrer"
            className="relative size-28 shrink-0 overflow-hidden rounded-xl sm:size-32"
          >
            <Image
              src={image}
              alt="Foto de la galería"
              fill
              className="object-cover"
              sizes="128px"
            />
          </a>
        ))}
      </div>
    </section>
  )
}
