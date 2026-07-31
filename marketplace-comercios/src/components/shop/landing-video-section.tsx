'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Play } from 'lucide-react'

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']

interface ParsedVideo {
  kind: 'embed'
  embedUrl: string
  thumbnailUrl: string | null
}

interface ParsedDirectVideo {
  kind: 'file'
  fileUrl: string
}

function parseVideo(url: string): ParsedVideo | ParsedDirectVideo | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      if (!videoId) return null
      return {
        kind: 'embed',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      }
    }
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1)
      if (!videoId) return null
      return {
        kind: 'embed',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      }
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      if (!videoId) return null
      return {
        kind: 'embed',
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
        thumbnailUrl: null,
      }
    }
    const lowerPath = parsed.pathname.toLowerCase()
    if (DIRECT_VIDEO_EXTENSIONS.some((extension) => lowerPath.endsWith(extension))) {
      return { kind: 'file', fileUrl: url }
    }
    return null
  } catch {
    return null
  }
}

export function LandingVideoSection({ url }: { url: string | null }) {
  const [isPlaying, setIsPlaying] = useState(false)
  if (!url) return null
  const video = parseVideo(url)
  if (!video) return null

  return (
    <section className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        {video.kind === 'file' ? (
          <video src={video.fileUrl} controls preload="metadata" className="size-full rounded-xl" />
        ) : isPlaying ? (
          <iframe
            src={video.embedUrl}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video de la tienda"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 flex size-full items-center justify-center bg-black/20"
            aria-label="Reproducir video"
          >
            {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            )}
            <span className="relative flex size-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
              <Play className="size-6 translate-x-0.5 text-foreground" fill="currentColor" aria-hidden />
            </span>
          </button>
        )}
      </div>
    </section>
  )
}
