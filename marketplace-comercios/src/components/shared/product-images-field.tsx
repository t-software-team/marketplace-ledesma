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

  const remaining = MAX_IMAGES - images.length

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">Fotos del {noun}</label>
        <span
          className={`text-xs font-medium ${
            images.length === 0 ? 'text-muted-foreground' : 'text-primary'
          }`}
        >
          {images.length}/{MAX_IMAGES} fotos
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Subí al menos 1 foto — con buena luz y fondo prolijo se ve mucho mejor. La primera va a ser
        la foto principal que se muestra en el feed; podés cambiar el orden después.
      </p>
      <input type="hidden" name="image_urls" value={JSON.stringify(images)} />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
            >
              <Image src={url} alt={`Foto ${index + 1}`} fill className="object-cover" sizes="112px" />
              {index === 0 && (
                <span className="absolute top-1 left-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label="Quitar foto"
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
              >
                <X className="size-4" aria-hidden />
              </button>
              <div className="absolute bottom-1 right-1 flex gap-0.5">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    aria-label="Mover a la izquierda"
                    className="flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    aria-label="Mover a la derecha"
                    className="flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-3">
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

          {isUploading ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Subiendo foto...
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Camera className="size-4" aria-hidden />
                Sacar foto
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ImagePlus className="size-4" aria-hidden />
                Elegir de la galería
              </button>
            </div>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Podés subir {remaining} foto{remaining === 1 ? '' : 's'} más
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
