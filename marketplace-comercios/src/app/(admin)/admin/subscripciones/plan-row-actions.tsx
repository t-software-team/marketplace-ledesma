'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { toggleSubscriptionPlanActive } from '@/lib/admin/actions'

interface PlanRowActionsProps {
  planId: string
  isActive: boolean
}

export function PlanRowActions({ planId, isActive }: PlanRowActionsProps) {
  const [isPending, startTransition] = useTransition()

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

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
      <Button
        render={<Link href={`/admin/subscripciones/planes/${planId}/editar`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Editar
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
    </div>
  )
}
