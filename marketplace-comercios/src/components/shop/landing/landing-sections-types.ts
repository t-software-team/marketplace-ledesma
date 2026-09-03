export interface LandingBanner {
  title: string
  subtitle: string | null
  image_url: string | null
  images: string[]
  cta_label: string | null
  cta_url: string | null
}

export interface LandingService {
  name: string
  description: string
}

export interface LandingSectionsValues {
  banner: LandingBanner
  bannerEnabled: boolean
  services: LandingService[]
  gallery: string[]
  videoUrl: string
}

export function parseBanner(value: unknown): LandingBanner {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const images = Array.isArray(raw.images)
    ? raw.images.filter((item): item is string => typeof item === 'string').slice(0, 6)
    : []
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    image_url: typeof raw.image_url === 'string' ? raw.image_url : '',
    images,
    cta_label: typeof raw.cta_label === 'string' ? raw.cta_label : '',
    cta_url: typeof raw.cta_url === 'string' ? raw.cta_url : '',
  } as LandingBanner
}

export function parseGallery(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').slice(0, 8)
}

export function parseServices(value: unknown): LandingService[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : '',
      description: typeof item.description === 'string' ? item.description : '',
    }))
}
