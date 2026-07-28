'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { toggleShopFollow } from '@/lib/shops/actions'
import { cn } from '@/lib/utils'

interface FollowShopButtonProps {
  shopId: string
  isLoggedIn: boolean
  initialIsFollowing: boolean
}

export function FollowShopButton({ shopId, isLoggedIn, initialIsFollowing }: FollowShopButtonProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    const next = !isFollowing
    setIsFollowing(next)
    startTransition(async () => {
      try {
        await toggleShopFollow(shopId)
        toast.add({ title: next ? 'Ahora seguís este comercio' : 'Dejaste de seguir', type: 'success' })
      } catch {
        setIsFollowing(!next)
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
