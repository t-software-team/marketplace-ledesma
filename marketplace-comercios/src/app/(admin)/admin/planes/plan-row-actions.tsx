'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { deleteSubscriptionPlan, toggleSubscriptionPlanActive } from '@/lib/admin/actions'

interface PlanRowActionsProps {
  planId: string
  planName: string
  isActive: boolean
}

export function PlanRowActions({ planId, planName, isActive }: PlanRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleSubscriptionPlanActive(planId, !isActive)
        toast.add({ title: isActive ? 'Plan desactivado' : 'Plan activado', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos actualizar el plan', type: 'error' })
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteSubscriptionPlan(planId)
        toast.add({ title: 'Plan eliminado', type: 'success' })
      } catch (error) {
        toast.add({
          title: error instanceof Error ? error.message : 'No pudimos eliminar el plan',
          type: 'error',
        })
      }
    })
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
      <Button
        render={<Link href={`/admin/planes/${planId}/editar`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Editar
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="destructive" size="sm" disabled={isDeleting} />
        }
        triggerLabel={isDeleting ? 'Eliminando...' : 'Eliminar'}
        triggerNativeButton
        title={`¿Eliminar el plan "${planName}"?`}
        description="Esta acción no se puede deshacer. Si hay comercios con suscripciones a este plan, no se podrá eliminar."
        confirmLabel="Eliminar"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
