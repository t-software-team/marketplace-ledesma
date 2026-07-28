'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from 'lucide-react'
import { uploadShopImage } from '@/lib/shops/upload-image'

const MAX_IMAGES = 6

interface ProductImagesFieldProps {
  shopId: string
  initialImages?: string[]
  noun?: string
}

export function ProductImagesField({
  shopId,
  initialImages = [],
  noun = 'producto',
}: ProductImagesFieldProps) {
  const [images, setImages] = useState(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const remaining = MAX_IMAGES - images.length
    const toUpload = files.slice(0, remaining)

    setIsUploading(true)
    setError(null)

    try {
      const urls = await Promise.all(
        toUpload.map((file) => uploadShopImage('product-images', shopId, file))
      )
      setImages((current) => [...current, ...urls])
    } catch (error) {
      console.error('ProductImagesField: fallo al subir imagen', { shopId, error })
      setError(error instanceof Error ? error.message : 'No pudimos subir alguna imagen')
    } finally {
      setIsUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index))
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Fotos del {noun}{' '}
        <span className="font-normal text-muted-foreground">
          ({images.length}/{MAX_IMAGES})
        </span>
      </label>
      <input type="hidden" name="image_urls" value={JSON.stringify(images)} />

      <div className="flex flex-wrap gap-2">
        {images.map((url, index) => (
          <div
            key={url}
            className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
          >
            <Image src={url} alt={`Foto ${index + 1}`} fill className="object-cover" sizes="96px" />
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                Principal
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              aria-label="Quitar foto"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
            >
              <X className="size-3.5" aria-hidden />
            </button>
            <div className="absolute bottom-1 right-1 flex gap-0.5">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  aria-label="Mover a la izquierda"
                  className="flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  aria-label="Mover a la derecha"
                  className="flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                >
                  <ChevronRight className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <div className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted">
            {isUploading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  aria-label="Tomar foto"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Camera className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  aria-label="Elegir de galería"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <ImagePlus className="size-4" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {images.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          La primera foto que subas va a ser la principal en el feed.
        </p>
      )}
    </div>
  )
}
