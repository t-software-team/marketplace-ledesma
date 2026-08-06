'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleFavorite } from '@/lib/shops/actions'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  productId: string
  initialIsFavorite: boolean
  isLoggedIn: boolean
  className?: string
}

export function FavoriteButton({
  productId,
  initialIsFavorite,
  isLoggedIn,
  className,
}: FavoriteButtonProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPending, startTransition] = useTransition()

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!isLoggedIn) {
      router.push(`/login?next=/producto/${productId}`)
      return
    }

    setIsFavorite((current) => !current)
    startTransition(async () => {
      try {
        await toggleFavorite(productId)
      } catch (error) {
        console.error('FavoriteButton: fallo al togglear favorito', { productId, error })
        setIsFavorite((current) => !current)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'flex size-11 items-center justify-center rounded-full border border-border bg-surface/90 text-muted-foreground backdrop-blur-sm transition-colors hover:text-destructive',
        isFavorite && 'text-destructive',
        className
      )}
    >
      <Heart className={cn('size-4', isFavorite && 'fill-destructive')} />
    </button>
  )
}
