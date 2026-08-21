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
  applyTemplate?: {
    key: string
    banner?: { title: string; subtitle: string }
  } | null
  visibleSection?: 'banner' | 'services' | 'gallery' | 'video' | 'all'
}

export function LandingSectionsEditor({
  shopId,
  landingBanner,
  landingServices,
  landingGallery,
  landingVideoUrl,
  onChange,
  applyTemplate,
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

  useEffect(() => {
    if (!applyTemplate?.banner) return
    if (banner.title.trim()) return
    setBanner((current) => ({ ...current, title: applyTemplate.banner!.title, subtitle: applyTemplate.banner!.subtitle }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTemplate?.key])

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
        visible={visibleSection === 'all' || visibleSection === 'banner'}
      />

      <LandingServicesSection
        services={services}
        setServices={setServices}
        visible={visibleSection === 'all' || visibleSection === 'services'}
      />

      <LandingGallerySection
        shopId={shopId}
        gallery={gallery}
        setGallery={setGallery}
        visible={visibleSection === 'all' || visibleSection === 'gallery'}
      />

      <LandingVideoSection
        shopId={shopId}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        visible={visibleSection === 'all' || visibleSection === 'video'}
      />
    </div>
  )
}
