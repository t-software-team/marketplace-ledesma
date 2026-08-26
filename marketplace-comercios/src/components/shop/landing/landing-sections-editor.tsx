'use client'

import { useEffect, useMemo, useState } from 'react'
import { LandingBannerSection } from './landing-banner-section'
import { LandingServicesSection } from './landing-services-section'
import { LandingGallerySection } from './landing-gallery-section'
import { LandingVideoSection } from './landing-video-section'
import {
  parseBanner,
  parseGallery,
  parseServices,
  type LandingBanner,
  type LandingService,
  type LandingSectionsValues,
} from './landing-sections-types'

export type { LandingBanner, LandingService, LandingSectionsValues } from './landing-sections-types'

interface LandingSectionsEditorProps {
  shopId: string
  landingBanner: unknown
  landingServices: unknown
  landingGallery?: unknown
  landingVideoUrl: string | null
  onChange?: (values: LandingSectionsValues) => void
  visibleSection?: LandingSection | LandingSection[] | 'all'
}

type LandingSection = 'banner' | 'services' | 'gallery' | 'video'

export function LandingSectionsEditor({
  shopId,
  landingBanner,
  landingServices,
  landingGallery,
  landingVideoUrl,
  onChange,
  visibleSection = 'all',
}: LandingSectionsEditorProps) {
  const [banner, setBanner] = useState<LandingBanner>(() => parseBanner(landingBanner))
  const bannerEnabled = Boolean(banner.title.trim())

  const [services, setServices] = useState<LandingService[]>(() => parseServices(landingServices))
  const [gallery, setGallery] = useState<string[]>(() => parseGallery(landingGallery))
  const [videoUrl, setVideoUrl] = useState(landingVideoUrl ?? '')

  useEffect(() => {
    onChange?.({ banner, bannerEnabled, services, gallery, videoUrl })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner, bannerEnabled, services, gallery, videoUrl])

  const bannerJson = useMemo(() => {
    if (!banner.title.trim()) return ''
    return JSON.stringify(banner)
  }, [banner])

  const servicesJson = useMemo(() => {
    const valid = services.filter((service) => service.name.trim())
    if (valid.length === 0) return ''
    return JSON.stringify(valid)
  }, [services])

  const galleryJson = useMemo(() => {
    if (gallery.length === 0) return ''
    return JSON.stringify(gallery)
  }, [gallery])

  const isVisible = (section: LandingSection) =>
    visibleSection === 'all' ||
    (Array.isArray(visibleSection) ? visibleSection.includes(section) : visibleSection === section)

  return (
    <div className="space-y-6">
      <input type="hidden" name="landing_banner_text" value={bannerJson} />
      <input type="hidden" name="landing_services_text" value={servicesJson} />
      <input type="hidden" name="landing_gallery_text" value={galleryJson} />

      <LandingBannerSection
        shopId={shopId}
        banner={banner}
        setBanner={setBanner}
        bannerEnabled={bannerEnabled}
        visible={isVisible('banner')}
      />

      <LandingServicesSection
        services={services}
        setServices={setServices}
        visible={isVisible('services')}
      />

      <LandingGallerySection
        shopId={shopId}
        gallery={gallery}
        setGallery={setGallery}
        visible={isVisible('gallery')}
      />

      <LandingVideoSection
        shopId={shopId}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        visible={isVisible('video')}
      />
    </div>
  )
}
