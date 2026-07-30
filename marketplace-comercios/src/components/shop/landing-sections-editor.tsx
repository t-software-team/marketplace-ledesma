'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uploadShopImage } from '@/lib/shops/upload-image'

interface LandingBanner {
  title: string
  subtitle: string | null
  image_url: string | null
  cta_label: string | null
  cta_url: string | null
}

interface LandingService {
  name: string
  description: string
}

interface LandingSectionsEditorProps {
  shopId: string
  landingBanner: unknown
  landingServices: unknown
  landingVideoUrl: string | null
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
}: LandingSectionsEditorProps) {
  const [banner, setBanner] = useState<LandingBanner>(() => parseBanner(landingBanner))
  const [bannerEnabled, setBannerEnabled] = useState(Boolean(banner.title))
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [services, setServices] = useState<LandingService[]>(() => parseServices(landingServices))
  const [videoUrl, setVideoUrl] = useState(landingVideoUrl ?? '')

  const bannerJson = useMemo(() => {
    if (!bannerEnabled || !banner.title.trim()) return ''
    return JSON.stringify(banner)
  }, [bannerEnabled, banner])

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

      <div className="space-y-3 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={bannerEnabled}
            onChange={(event) => setBannerEnabled(event.target.checked)}
            className="size-4"
          />
          Banner promocional
        </label>
        <p className="pl-6 text-xs text-muted-foreground">
          Aparece arriba de todo en tu tienda pública. Ideal para una promo, un mensaje de
          bienvenida o destacar algo puntual.
        </p>

        {bannerEnabled && (
          <div className="space-y-3 pl-6">
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
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Servicios destacados</p>
            <p className="text-xs text-muted-foreground">
              Mostralos como tarjetas antes de tus productos. Hasta 6.
            </p>
          </div>
          {services.length < 6 && (
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addService}>
              <Plus className="size-3.5" aria-hidden />
              Agregar
            </Button>
          )}
        </div>

        {services.map((service, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeService(index)}
              aria-label="Quitar servicio"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-border p-3">
        <label htmlFor="landing_video_url" className="text-sm font-medium">
          Video (opcional)
        </label>
        <p className="text-xs text-muted-foreground">
          Pegá un link de YouTube o Vimeo. Se muestra debajo de la descripción de tu tienda.
        </p>
        <Input
          id="landing_video_url"
          name="landing_video_url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
        />
      </div>
    </div>
  )
}
