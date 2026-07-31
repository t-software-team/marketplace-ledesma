'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadShopImage, uploadShopLandingVideo } from '@/lib/shops/upload-image'

export interface LandingBanner {
  title: string
  subtitle: string | null
  image_url: string | null
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
  videoUrl: string
}

interface LandingSectionsEditorProps {
  shopId: string
  landingBanner: unknown
  landingServices: unknown
  landingVideoUrl: string | null
  onChange?: (values: LandingSectionsValues) => void
  applyTemplate?: {
    key: string
    banner?: { title: string; subtitle: string }
  } | null
  visibleSection?: 'banner' | 'services' | 'video' | 'all'
}

function parseBanner(value: unknown): LandingBanner {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    image_url: typeof raw.image_url === 'string' ? raw.image_url : '',
    cta_label: typeof raw.cta_label === 'string' ? raw.cta_label : '',
    cta_url: typeof raw.cta_url === 'string' ? raw.cta_url : '',
  } as LandingBanner
}

function parseServices(value: unknown): LandingService[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : '',
      description: typeof item.description === 'string' ? item.description : '',
    }))
}

export function LandingSectionsEditor({
  shopId,
  landingBanner,
  landingServices,
  landingVideoUrl,
  onChange,
  applyTemplate,
  visibleSection = 'all',
}: LandingSectionsEditorProps) {
  const [banner, setBanner] = useState<LandingBanner>(() => parseBanner(landingBanner))
  const bannerEnabled = Boolean(banner.title.trim())
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [services, setServices] = useState<LandingService[]>(() => parseServices(landingServices))
  const [videoUrl, setVideoUrl] = useState(landingVideoUrl ?? '')
  const [videoInputMode, setVideoInputMode] = useState<'link' | 'file'>('link')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null)

  useEffect(() => {
    onChange?.({ banner, bannerEnabled, services, videoUrl })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner, bannerEnabled, services, videoUrl])

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

  async function handleBannerImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingBanner(true)
    setUploadError(null)
    try {
      const url = await uploadShopImage('shop-promotions', shopId, file)
      setBanner((current) => ({ ...current, image_url: url }))
    } catch (error) {
      console.error('LandingSectionsEditor: fallo al subir imagen del banner', { error })
      setUploadError(error instanceof Error ? error.message : 'No pudimos subir la imagen')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  async function handleVideoFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingVideo(true)
    setVideoUploadError(null)
    try {
      const url = await uploadShopLandingVideo(shopId, file)
      setVideoUrl(url)
    } catch (error) {
      console.error('LandingSectionsEditor: fallo al subir video de la landing', { error })
      setVideoUploadError(error instanceof Error ? error.message : 'No pudimos subir el video')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  function addService() {
    if (services.length >= 6) return
    setServices((current) => [...current, { name: '', description: '' }])
  }

  function updateService(index: number, patch: Partial<LandingService>) {
    setServices((current) =>
      current.map((service, i) => (i === index ? { ...service, ...patch } : service))
    )
  }

  function removeService(index: number) {
    setServices((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="landing_banner_text" value={bannerJson} />
      <input type="hidden" name="landing_services_text" value={servicesJson} />

      <div className={cn('space-y-3 rounded-lg border border-border p-3', visibleSection !== 'all' && visibleSection !== 'banner' && 'hidden')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Banner promocional</p>
            <p className="text-xs text-muted-foreground">
              Aparece arriba de todo en tu tienda pública. Ideal para una promo, un mensaje de
              bienvenida o destacar algo puntual.
            </p>
          </div>
          {bannerEnabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1 text-muted-foreground hover:text-destructive"
              onClick={() => setBanner(parseBanner(null))}
            >
              <X className="size-3.5" aria-hidden />
              Quitar
            </Button>
          )}
        </div>

        <div className="space-y-3">
            <Input
              placeholder="Título (ej: 20% off en tu primera compra)"
              value={banner.title}
              onChange={(event) => setBanner((current) => ({ ...current, title: event.target.value }))}
              maxLength={80}
            />
            <Input
              placeholder="Bajada (opcional)"
              value={banner.subtitle ?? ''}
              onChange={(event) => setBanner((current) => ({ ...current, subtitle: event.target.value }))}
              maxLength={200}
            />
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={handleBannerImageUpload} disabled={isUploadingBanner} />
              {banner.image_url && (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={banner.image_url} alt="Banner" fill className="object-cover" sizes="48px" />
                  <button
                    type="button"
                    onClick={() => setBanner((current) => ({ ...current, image_url: '' }))}
                    aria-label="Quitar imagen del banner"
                    className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
                  >
                    <X className="size-2.5" aria-hidden />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Si subís una imagen, se usa como fondo del banner (ideal apaisada, ej: 1200x500px). Sin
              imagen, se muestra solo el texto.
            </p>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Texto del botón (opcional)"
                value={banner.cta_label ?? ''}
                onChange={(event) => setBanner((current) => ({ ...current, cta_label: event.target.value }))}
                maxLength={40}
              />
              <Input
                placeholder="Link del botón (opcional)"
                value={banner.cta_url ?? ''}
                onChange={(event) => setBanner((current) => ({ ...current, cta_url: event.target.value }))}
              />
            </div>
        </div>
      </div>

      <div className={cn('space-y-4 rounded-xl border border-border p-4 lg:p-5', visibleSection !== 'all' && visibleSection !== 'services' && 'hidden')}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Servicios destacados</p>
            <p className="text-xs text-muted-foreground">
              Mostralos como tarjetas antes de tus productos. Hasta 6.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                services.length >= 6 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'
              )}
            >
              {services.length}/6
            </span>
            {services.length < 6 && (
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addService}>
                <Plus className="size-3.5" aria-hidden />
                Agregar
              </Button>
            )}
          </div>
        </div>

        {services.length === 0 ? (
          <button
            type="button"
            onClick={addService}
            className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <Plus className="size-5" aria-hidden />
            <span className="text-sm">Agregá tu primer servicio</span>
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative space-y-2 rounded-lg border border-border bg-surface p-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
                    onClick={() => removeService(index)}
                    aria-label="Quitar servicio"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
                <Input
                  placeholder="Nombre del servicio"
                  value={service.name}
                  onChange={(event) => updateService(index, { name: event.target.value })}
                  maxLength={60}
                />
                <Input
                  placeholder="Descripción breve (opcional)"
                  value={service.description}
                  onChange={(event) => updateService(index, { description: event.target.value })}
                  maxLength={200}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cn('space-y-2 rounded-lg border border-border p-3', visibleSection !== 'all' && visibleSection !== 'video' && 'hidden')}>
        <label htmlFor="landing_video_url" className="text-sm font-medium">
          Video (opcional)
        </label>
        <p className="text-xs text-muted-foreground">
          Se muestra debajo de la descripción de tu tienda.
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={videoInputMode === 'link' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVideoInputMode('link')}
          >
            Pegar link
          </Button>
          <Button
            type="button"
            variant={videoInputMode === 'file' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVideoInputMode('file')}
          >
            Subir archivo
          </Button>
        </div>

        {videoInputMode === 'link' ? (
          <>
            <p className="text-xs text-muted-foreground">Pegá un link de YouTube o Vimeo.</p>
            <Input
              id="landing_video_url"
              name="landing_video_url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
            />
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Video corto en MP4, WEBM o MOV. Máximo 20MB y 20 segundos.</p>
            <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoFileUpload} disabled={isUploadingVideo} />
            {isUploadingVideo && <p className="text-xs text-muted-foreground">Subiendo video...</p>}
            {videoUploadError && <p className="text-xs text-destructive">{videoUploadError}</p>}
            {videoUrl && !isUploadingVideo && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5">
                <p className="flex-1 truncate text-xs text-muted-foreground">Video actual: {videoUrl}</p>
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  aria-label="Quitar video"
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </div>
            )}
            <input type="hidden" id="landing_video_url" name="landing_video_url" value={videoUrl} />
          </>
        )}
      </div>
    </div>
  )
}
