'use client'

import Image from 'next/image'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadShopImage } from '@/lib/shops/upload-image'
import { parseBanner, type LandingBanner } from './landing-sections-types'

interface LandingBannerSectionProps {
  shopId: string
  banner: LandingBanner
  setBanner: React.Dispatch<React.SetStateAction<LandingBanner>>
  bannerEnabled: boolean
  visible: boolean
}

export function LandingBannerSection({
  shopId,
  banner,
  setBanner,
  bannerEnabled,
  visible,
}: LandingBannerSectionProps) {
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleBannerImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (banner.images.length >= 6) return

    setIsUploadingBanner(true)
    setUploadError(null)
    try {
      const url = await uploadShopImage('shop-promotions', shopId, file)
      setBanner((current) => ({
        ...current,
        images: [...current.images, url],
        image_url: current.image_url || url,
      }))
    } catch (error) {
      console.error('LandingSectionsEditor: fallo al subir imagen del banner', { error })
      setUploadError(error instanceof Error ? error.message : 'No pudimos subir la imagen')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  function removeBannerImage(index: number) {
    setBanner((current) => {
      const images = current.images.filter((_, i) => i !== index)
      return { ...current, images, image_url: images[0] ?? '' }
    })
  }

  return (
    <div className={cn('space-y-3 rounded-lg border border-border p-3', !visible && 'hidden')}>
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
        <div className="flex flex-wrap items-center gap-3">
          {banner.images.map((image, index) => (
            <div key={index} className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={image} alt="Banner" fill className="object-cover" sizes="48px" />
              <button
                type="button"
                onClick={() => removeBannerImage(index)}
                aria-label="Quitar imagen del banner"
                className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
              >
                <X className="size-2.5" aria-hidden />
              </button>
            </div>
          ))}
          {banner.images.length < 6 && (
            <Input
              type="file"
              accept="image/*"
              onChange={handleBannerImageUpload}
              disabled={isUploadingBanner}
              className="max-w-[220px]"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Subí hasta 6 imágenes (ideal apaisadas, ej: 1200x500px). Con más de una, se muestran en
          carrusel. Sin imágenes, se muestra solo el texto.
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
  )
}
