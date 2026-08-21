'use client'

import Image from 'next/image'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { uploadShopImage } from '@/lib/shops/upload-image'

interface LandingGallerySectionProps {
  shopId: string
  gallery: string[]
  setGallery: React.Dispatch<React.SetStateAction<string[]>>
  visible: boolean
}

export function LandingGallerySection({ shopId, gallery, setGallery, visible }: LandingGallerySectionProps) {
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null)

  async function handleGalleryImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (gallery.length >= 8) return

    setIsUploadingGallery(true)
    setGalleryUploadError(null)
    try {
      const url = await uploadShopImage('shop-promotions', shopId, file)
      setGallery((current) => [...current, url])
    } catch (error) {
      console.error('LandingSectionsEditor: fallo al subir imagen de la galería', { error })
      setGalleryUploadError(error instanceof Error ? error.message : 'No pudimos subir la imagen')
    } finally {
      setIsUploadingGallery(false)
    }
  }

  function removeGalleryImage(index: number) {
    setGallery((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-3 rounded-xl border border-border p-4 lg:p-5', !visible && 'hidden')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Galería de fotos</p>
          <p className="text-xs text-muted-foreground">
            Mostrá fotos de tu local o trabajos. Hasta 8.
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            gallery.length >= 8 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'
          )}
        >
          {gallery.length}/8
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {gallery.map((image, index) => (
          <div key={index} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={image} alt="Foto de la galería" fill className="object-cover" sizes="64px" />
            <button
              type="button"
              onClick={() => removeGalleryImage(index)}
              aria-label="Quitar foto de la galería"
              className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
            >
              <X className="size-2.5" aria-hidden />
            </button>
          </div>
        ))}
        {gallery.length < 8 && (
          <Input
            type="file"
            accept="image/*"
            onChange={handleGalleryImageUpload}
            disabled={isUploadingGallery}
            className="max-w-[220px]"
          />
        )}
      </div>
      {galleryUploadError && <p className="text-xs text-destructive">{galleryUploadError}</p>}
    </div>
  )
}
