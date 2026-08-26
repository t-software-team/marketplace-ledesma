'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/**
 * Carrusel de imágenes para el hero del template Marketplace: rectángulo
 * redondeado con scroll-snap, auto-avance y puntos. Mantiene el marco dentro
 * del hero con gradiente (a diferencia del banner full-bleed clásico).
 */
export function ShopmoreHeroCarousel({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideCount = images.length

  useEffect(() => {
    if (slideCount <= 1) return
    const interval = setInterval(() => {
      const container = containerRef.current
      if (!container) return
      const nextIndex = (Math.round(container.scrollLeft / container.clientWidth) + 1) % slideCount
      container.scrollTo({ left: nextIndex * container.clientWidth, behavior: 'smooth' })
    }, 4500)
    return () => clearInterval(interval)
  }, [slideCount])

  function handleScroll() {
    const container = containerRef.current
    if (!container) return
    setActiveIndex(Math.round(container.scrollLeft / container.clientWidth))
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-primary/10">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <div key={index} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 32rem"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {slideCount > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
          {images.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full bg-white transition-all ${
                index === activeIndex ? 'w-4' : 'w-1.5 bg-white/50'
              }`}
              aria-hidden
            />
          ))}
        </div>
      )}
    </div>
  )
}
