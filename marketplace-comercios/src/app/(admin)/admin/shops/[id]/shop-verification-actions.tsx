'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { approveShopVerification, rejectShopVerification } from '@/lib/admin/actions/shops'

interface ShopVerificationActionsProps {
  shopId: string
}

export function ShopVerificationActions({ shopId }: ShopVerificationActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveShopVerification(shopId)
        toast.add({ title: 'Comercio verificado', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos aprobar la verificación', type: 'error' })
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectShopVerification(shopId)
        toast.add({ title: 'Verificación rechazada', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos rechazar la verificación', type: 'error' })
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={handleApprove}>
        Aprobar
      </Button>
      <ConfirmDialog
        trigger={<Button variant="destructive" disabled={isPending} />}
        triggerLabel="Rechazar"
        title="¿Rechazar la verificación de este comercio?"
        confirmLabel="Rechazar"
        isConfirming={isPending}
        onConfirm={handleReject}
      />
    </div>
  )
}
