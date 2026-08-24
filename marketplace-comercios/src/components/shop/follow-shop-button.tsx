'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useMyShopStatus } from '@/hooks/use-my-shop-status'
import { toggleShopFollow } from '@/lib/shops/actions'
import { cn } from '@/lib/utils'

interface FollowShopButtonProps {
  shopId: string
}

export function FollowShopButton({ shopId }: FollowShopButtonProps) {
  const router = useRouter()
  // Login + estado de seguimiento se resuelven en el cliente para que la página
  // de tienda pueda ser estática/ISR. Mientras carga, el botón muestra "Seguir"
  // (estado neutro) en vez de saltar de un estado al otro.
  const { data: status } = useMyShopStatus(shopId)
  const isLoggedIn = Boolean(status?.isLoggedIn)
  const serverFollowing = Boolean(status?.isFollowing)
  // Override optimista aplicado al hacer click; el valor mostrado se deriva del
  // estado del hook + este override (sin useEffect).
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)
  const [isPending, startTransition] = useTransition()

  const isFollowing = optimisticFollowing ?? serverFollowing

  function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    const next = !isFollowing
    setOptimisticFollowing(next)
    startTransition(async () => {
      try {
        await toggleShopFollow(shopId)
        toast.add({ title: next ? 'Ahora seguís este comercio' : 'Dejaste de seguir', type: 'success' })
      } catch {
        setOptimisticFollowing(!next)
        toast.add({ title: 'No pudimos actualizar', type: 'error' })
      }
    })
  }

  return (
    <Button
      type="button"
      variant={isFollowing ? 'default' : 'outline'}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      className="gap-1.5"
    >
      <Heart className={cn('size-3.5', isFollowing && 'fill-current')} aria-hidden />
      {isFollowing ? 'Siguiendo' : 'Seguir'}
    </Button>
  )
}
