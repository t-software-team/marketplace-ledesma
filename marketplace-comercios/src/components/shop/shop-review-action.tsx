'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShopReviewDialog } from '@/components/shop/shop-review-dialog'
import { useMyShopStatus } from '@/hooks/use-my-shop-status'

interface ShopReviewActionProps {
  shopId: string
  slug: string
}

/**
 * Resuelve en el cliente si mostrar el diálogo de reseña (usuario logueado, con
 * su reseña previa) o el botón de login, para que `/tienda/[slug]` no dependa de
 * la sesión en el servidor. Mientras carga muestra un placeholder neutro del
 * tamaño del control, evitando el salto login→diálogo en la hidratación.
 */
export function ShopReviewAction({ shopId, slug }: ShopReviewActionProps) {
  const { data: status, isPending } = useMyShopStatus(shopId)

  if (isPending) {
    return <span className="h-8 w-40 animate-pulse rounded-md bg-muted" aria-hidden />
  }

  if (status?.isLoggedIn) {
    return <ShopReviewDialog shopId={shopId} myReview={status.myReview} />
  }

  return (
    <Button
      render={<Link href={`/login?next=/tienda/${slug}`} />}
      nativeButton={false}
      variant="outline"
      size="sm"
    >
      Iniciar sesión para dejar una reseña
    </Button>
  )
}
