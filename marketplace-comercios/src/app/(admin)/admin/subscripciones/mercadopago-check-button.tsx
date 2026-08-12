'use client'

import { useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { checkMercadoPagoSubscription } from '@/lib/admin/actions'

interface MercadoPagoCheckButtonProps {
  referenceId: string
}

export function MercadoPagoCheckButton({ referenceId }: MercadoPagoCheckButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await checkMercadoPagoSubscription(referenceId)
        if (result.activated) {
          toast.add({ title: 'Pago confirmado, suscripción activada', type: 'success' })
        } else {
          toast.add({
            title: `Todavía no está pago (estado: ${result.status})`,
            type: 'info',
          })
        }
      } catch {
        toast.add({ title: 'No pudimos consultar Mercado Pago', type: 'error' })
      }
    })
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={isPending} onClick={handleClick}>
      <RefreshCw className="size-3.5" aria-hidden />
      {isPending ? 'Verificando...' : 'Verificar con Mercado Pago'}
    </Button>
  )
}
