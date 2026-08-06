'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogPortal, DialogOverlay, DialogContent } from '@/components/ui/dialog'

interface ProductGalleryProps {
  images: { id: string; url: string }[]
  productName: string
  videoUrl?: string | null
  imageOverlay?: React.ReactNode
}

type Slide = { type: 'image'; id: string; url: string } | { type: 'video'; id: string; url: string }

export function ProductGallery({ images, productName, videoUrl, imageOverlay }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const slides: Slide[] = [
    ...images.map((image) => ({ type: 'image' as const, id: image.id, url: image.url })),
    ...(videoUrl ? [{ type: 'video' as const, id: 'video', url: videoUrl }] : []),
  ]
  const activeSlide = slides[activeIndex]

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {imageOverlay}
        {activeSlide?.type === 'image' ? (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 size-full cursor-zoom-in"
            aria-label="Ver imagen completa"
          >
            <Image
              src={activeSlide.url}
              alt={productName}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </button>
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
                'relative size-14 shrink-0 overflow-hidden rounded-lg transition-opacity',
                index === activeIndex ? 'opacity-100 ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
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
                    <Image
                      src={images[0].url}
                      alt={`${productName} - imagen 1`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="size-4 fill-white text-white" aria-hidden />
                  </span>
                </>
              ) : (
                <Image
                  src={slide.url}
                  alt={`${productName} - imagen ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {activeSlide?.type === 'image' && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogPortal>
            <DialogOverlay className="bg-black/90" />
            <DialogContent
              showCloseButton={false}
              className="top-0 left-0 grid h-dvh w-screen max-w-none translate-x-0 translate-y-0 place-items-center rounded-none bg-transparent p-0 ring-0"
            >
              <div className="relative h-full w-full">
                <Image
                  src={activeSlide.url}
                  alt={productName}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="fixed top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Cerrar"
              >
                <X className="size-5" aria-hidden />
              </button>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}
    </div>
  )
}
