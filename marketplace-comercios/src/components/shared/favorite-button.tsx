'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useFavoriteStatus } from '@/hooks/use-favorite-status'
import { toggleFavorite } from '@/lib/shops/actions'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  productId: string
  /**
   * Estado inicial provisto por el servidor (ej. cards del feed). Si se omite,
   * el botón resuelve login + favorito en el cliente (hook useFavoriteStatus),
   * para que la página que lo contiene pueda renderizarse estática/cacheada sin
   * llamar a auth.getUser() por request.
   */
  initialIsFavorite?: boolean
  isLoggedIn?: boolean
  className?: string
}

export function FavoriteButton({
  productId,
  initialIsFavorite,
  isLoggedIn: initialIsLoggedIn,
  className,
}: FavoriteButtonProps) {
  const router = useRouter()
  const selfFetch = initialIsLoggedIn === undefined
  // Fail-open a propósito: useFavoriteStatus loguea sus errores y devuelve
  // { isLoggedIn: false, isFavorite: false } ante un fallo, así que no
  // consumimos isError/isLoading — un indicador de favorito que no cargó se
  // muestra como corazón vacío en vez de bloquear el botón o mostrar un error.
  const { data: fetchedStatus } = useFavoriteStatus(productId, selfFetch)
  // Override optimista aplicado al hacer click; se deriva el valor mostrado en
  // render (sin useEffect) a partir del estado del server + este override.
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLoggedIn = selfFetch ? Boolean(fetchedStatus?.isLoggedIn) : Boolean(initialIsLoggedIn)
  const serverFavorite = selfFetch
    ? Boolean(fetchedStatus?.isFavorite)
    : Boolean(initialIsFavorite)
  const isFavorite = optimisticFavorite ?? serverFavorite

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!isLoggedIn) {
      router.push(`/login?next=/producto/${productId}`)
      return
    }

    const next = !isFavorite
    setOptimisticFavorite(next)
    startTransition(async () => {
      try {
        await toggleFavorite(productId)
      } catch (error) {
        console.error('FavoriteButton: fallo al togglear favorito', { productId, error })
        setOptimisticFavorite(!next)
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
