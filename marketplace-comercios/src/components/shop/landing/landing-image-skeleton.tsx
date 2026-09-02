'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

export function ImageWithSkeleton({ className, alt, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />}
      <Image
        {...props}
        alt={alt}
        className={cn('transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
        onLoad={(event) => {
          setLoaded(true)
          onLoad?.(event)
        }}
      />
    </div>
  )
}
