'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Store } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { becomeShopAdmin } from '@/lib/profile/actions'

export function BecomeSellerCard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await becomeShopAdmin()
        toast.add({ title: '¡Ahora podés vender!', type: 'success' })
        router.push('/mi-tienda')
        router.refresh()
      } catch (error) {
        toast.add({
          title: 'No pudimos cambiar tu cuenta',
          description: error instanceof Error ? error.message : undefined,
          type: 'error',
        })
      }
    })
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Store className="size-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">¿Querés vender en Todo Marketplace?</p>
            <p className="text-xs text-muted-foreground">
              Convertí tu cuenta en una cuenta de comercio y creá tu tienda gratis.
            </p>
          </div>
        </div>
        <ConfirmDialog
          trigger={<Button size="sm" className="w-full shrink-0 sm:w-auto" disabled={isPending} />}
          triggerLabel={isPending ? 'Procesando...' : 'Quiero vender'}
          title="¿Pasar a cuenta de comercio?"
          description="Vas a poder crear tu tienda y cargar productos o servicios. Tu cuenta actual de cliente (favoritos, reseñas) se mantiene igual."
          confirmLabel="Sí, quiero vender"
          isConfirming={isPending}
          onConfirm={handleConfirm}
        />
      </CardContent>
    </Card>
  )
}
