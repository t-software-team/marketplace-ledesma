'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: { id: string; url: string }[]
  productName: string
  videoUrl?: string | null
}

type Slide = { type: 'image'; id: string; url: string } | { type: 'video'; id: string; url: string }

export function ProductGallery({ images, productName, videoUrl }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const slides: Slide[] = [
    ...images.map((image) => ({ type: 'image' as const, id: image.id, url: image.url })),
    ...(videoUrl ? [{ type: 'video' as const, id: 'video', url: videoUrl }] : []),
  ]
  const activeSlide = slides[activeIndex]

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
        {activeSlide?.type === 'image' ? (
          <Image
            src={activeSlide.url}
            alt={productName}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
          />
        ) : activeSlide?.type === 'video' ? (
          <video
            src={activeSlide.url}
            controls
            playsInline
            preload="metadata"
            poster={images[0]?.url}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors',
                index === activeIndex ? 'border-primary' : 'border-transparent'
              )}
              aria-label={
                slide.type === 'video'
                  ? `Ver video de ${productName}`
                  : `Ver imagen ${index + 1} de ${productName}`
              }
            >
              {slide.type === 'video' ? (
                <>
                  {images[0] && (
                    <Image src={images[0].url} alt="" fill className="object-cover" sizes="64px" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="size-5 fill-white text-white" aria-hidden />
                  </span>
                </>
              ) : (
                <Image src={slide.url} alt="" fill className="object-cover" sizes="64px" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
