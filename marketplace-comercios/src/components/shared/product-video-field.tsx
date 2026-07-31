'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Video, X } from 'lucide-react'
import { uploadProductVideo } from '@/lib/shops/upload-image'

interface ProductVideoFieldProps {
  shopId: string
  initialVideoUrl?: string | null
  noun?: string
  videoLimitReached?: boolean
}

export function ProductVideoField({
  shopId,
  initialVideoUrl = null,
  noun = 'producto',
  videoLimitReached = false,
}: ProductVideoFieldProps) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blocked = videoLimitReached && !videoUrl

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const url = await uploadProductVideo(shopId, file)
      setVideoUrl(url)
    } catch (err) {
      console.error('ProductVideoField: fallo al subir video', { shopId, error: err })
      setError(err instanceof Error ? err.message : 'No pudimos subir el video')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Video corto <span className="font-normal text-muted-foreground">(opcional, máx. 45s)</span>
      </label>
      <input type="hidden" name="video_url" value={videoUrl} />

      {videoUrl ? (
        <div className="relative w-full max-w-xs overflow-hidden rounded-xl border border-border bg-black">
          <video src={videoUrl} controls playsInline preload="metadata" className="aspect-[9/16] w-full" />
          <button
            type="button"
            onClick={() => setVideoUrl('')}
            aria-label="Quitar video"
            className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : blocked ? (
        <div className="w-full max-w-xs rounded-xl border border-dashed border-border bg-muted px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Llegaste al límite de videos de tu plan.{' '}
            <Link href="/mi-tienda/suscripcion" className="underline">
              Mejorá a Plan Básico o Ilimitado
            </Link>{' '}
            para sumar más.
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center">
          {isUploading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Video className="size-6" aria-hidden />
                <span className="text-xs font-medium">
                  Grabar o subir un video de tu {noun}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
