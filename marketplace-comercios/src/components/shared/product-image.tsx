'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getThumbnailUrl } from '@/lib/shops/upload-image'

interface ProductImageProps {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

/**
 * Usa la miniatura (600px) cuando existe y cae de vuelta a la imagen grande
 * si falla (fotos subidas antes de que se generaran miniaturas no la
 * tienen, y piden un archivo -thumb.webp que no existe en Storage).
 */
export function ProductImage({ src, alt, sizes, priority, className }: ProductImageProps) {
  const thumbUrl = getThumbnailUrl(src)
  const [failed, setFailed] = useState(false)
  const finalSrc = failed || !thumbUrl ? src : thumbUrl

  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  )
}
