'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadShopLandingVideo } from '@/lib/shops/upload-image'

interface LandingVideoSectionProps {
  shopId: string
  videoUrl: string
  setVideoUrl: React.Dispatch<React.SetStateAction<string>>
  visible: boolean
}

export function LandingVideoSection({ shopId, videoUrl, setVideoUrl, visible }: LandingVideoSectionProps) {
  const [videoInputMode, setVideoInputMode] = useState<'link' | 'file'>('link')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null)

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

  return (
    <div className={cn('space-y-2 rounded-lg border border-border p-3', !visible && 'hidden')}>
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
  )
}
