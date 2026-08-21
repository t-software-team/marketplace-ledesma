'use client'

import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { getSubscriptionPlans } from '@/lib/admin/queries'

type Plan = Awaited<ReturnType<typeof getSubscriptionPlans>>[number]

export function ChangePlanDialog({
  open,
  onOpenChange,
  selectedCount,
  plans,
  selectedPlanId,
  onSelectedPlanIdChange,
  isPending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  plans: Plan[]
  selectedPlanId: string
  onSelectedPlanIdChange: (value: string) => void
  isPending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <CreditCard className="size-3.5" aria-hidden />
        Cambiar plan
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Cambiar plan de {selectedCount} comercio{selectedCount === 1 ? '' : 's'}
          </DialogTitle>
        </DialogHeader>
        <select
          value={selectedPlanId}
          onChange={(event) => onSelectedPlanIdChange(event.target.value)}
          aria-label="Plan de suscripción"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Seleccioná un plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={isPending || !selectedPlanId} onClick={onConfirm}>
            {isPending ? 'Guardando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
