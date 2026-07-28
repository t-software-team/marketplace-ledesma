'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: { id: string; url: string }[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]

  return (
    <div className="space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
        {activeImage ? (
          <Image
            src={activeImage.url}
            alt={productName}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors',
                index === activeIndex ? 'border-primary' : 'border-transparent'
              )}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
