'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteGymPlan, setGymPlanActive } from '@/lib/gym/actions'

export function PlanRowActions({ planId, isActive }: { planId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            void setGymPlanActive(planId, !isActive)
          })
        }
      >
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (confirm('¿Borrar este plan? No afecta a las membresías ya registradas.')) {
            startTransition(() => {
              void deleteGymPlan(planId)
            })
          }
        }}
      >
        Borrar
      </Button>
    </div>
  )
}
