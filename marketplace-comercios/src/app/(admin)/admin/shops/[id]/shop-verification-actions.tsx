'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { approveShopVerification, rejectShopVerification } from '@/lib/admin/actions'

interface ShopVerificationActionsProps {
  shopId: string
}

export function ShopVerificationActions({ shopId }: ShopVerificationActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleApprove() {
    startTransition(async () => {
      await approveShopVerification(shopId)
      router.refresh()
    })
  }

  function handleReject() {
    startTransition(async () => {
      await rejectShopVerification(shopId)
      router.refresh()
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
