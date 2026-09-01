'use client'

import Image from 'next/image'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOutsideClick } from '@/hooks/use-outside-click'

// Adaptado de "Apple Cards Carousel" (ui.aceternity.com), con lucide-react en
// vez de tabler-icons y tokens de diseño propios (rounded-xl, bg-surface,
// border-border) en vez de los grises fijos del original.

export interface GalleryCard {
  src: string
  title: string
  category: string
  // Dimensiones reales de la imagen: cuando se pasan, la card respeta el
  // alto natural de la imagen (ancho fijo, alto auto) en vez de recortarla
  // en un cuadrado. Sin ellas, cae al comportamiento anterior (cuadrado +
  // object-cover), necesario para fotos de galería subidas por el usuario
  // cuyo tamaño no rastreamos.
  width?: number
  height?: number
}

const CarouselContext = createContext<{ onCardClose: (index: number) => void }>({
  onCardClose: () => {},
})

export function GalleryCarousel({ items }: { items: GalleryCard[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function checkScrollability() {
    const el = carouselRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }

  useEffect(() => {
    checkScrollability()
  }, [items])

  // Mide la primera card en vez de asumir un ancho fijo: el carrusel se
  // reutiliza tanto para fotos cuadradas chicas como para capturas grandes
  // con "peek" (~82% del contenedor), y ambas conviven con el mismo cálculo.
  function getStep(el: HTMLDivElement) {
    const firstCard = el.firstElementChild as HTMLElement | null
    const gap = 16
    return (firstCard?.getBoundingClientRect().width ?? 260) + gap
  }

  function scrollByCard(direction: 1 | -1) {
    const el = carouselRef.current
    if (!el) return
    el.scrollBy({ left: direction * getStep(el), behavior: 'smooth' })
  }

  function handleCardClose(index: number) {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: getStep(el) * (index + 1), behavior: 'smooth' })
  }

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose }}>
      <div className="relative w-full">
        <div
          ref={carouselRef}
          onScroll={checkScrollability}
          className="flex w-full gap-4 overflow-x-auto scroll-smooth py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((card, index) => (
            <GalleryCard key={`${card.src}-${index}`} card={card} index={index} />
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollLeft}
            aria-label="Ver fotos anteriores"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollRight}
            aria-label="Ver más fotos"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:text-foreground disabled:opacity-40"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

function GalleryCard({ card, index }: { card: GalleryCard; index: number }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onCardClose } = useContext(CarouselContext)

  function handleClose() {
    setOpen(false)
    onCardClose(index)
  }

  // Ref con la última versión de handleClose: evita listar onCardClose/index
  // como deps del efecto (cambiarían en cada scroll del carrusel) sin
  // silenciar exhaustive-deps con una directiva. Se actualiza en un efecto
  // (no durante el render) porque mutar un ref en render está prohibido.
  const handleCloseRef = useRef(handleClose)
  useEffect(() => {
    handleCloseRef.current = handleClose
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleCloseRef.current()
    }
    document.body.style.overflow = open ? 'hidden' : ''
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useOutsideClick(containerRef, () => {
    if (open) handleClose()
  })

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`gallery-card-${card.src}`}
              ref={containerRef}
              className="relative z-10 mx-auto my-10 h-fit max-w-3xl overflow-hidden rounded-3xl bg-surface"
            >
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <X className="size-4" aria-hidden />
              </button>
              <div className="relative aspect-[4/3] w-full sm:aspect-video">
                <Image src={card.src} alt={card.title} fill className="object-cover" sizes="768px" priority />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={`gallery-card-${card.src}`}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'relative z-0 shrink-0 overflow-hidden rounded-2xl bg-muted',
          card.width && card.height ? 'w-[82%] sm:w-[380px]' : 'h-52 w-52 sm:h-64 sm:w-64'
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/60 to-transparent'
          )}
        />
        <span className="absolute bottom-2 left-3 z-20 text-xs font-medium text-white">{card.title}</span>
        {card.width && card.height ? (
          <Image
            src={card.src}
            alt={card.title}
            width={card.width}
            height={card.height}
            className="w-full"
            sizes="(max-width: 640px) 82vw, 380px"
          />
        ) : (
          <Image
            src={card.src}
            alt={card.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 208px, 256px"
          />
        )}
      </motion.button>
    </>
  )
}
