'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { adminSetShopPlan } from '@/lib/admin/actions/shops'

interface ShopPlanCardProps {
  shopId: string
  activePlanId: string | null
  plans: { id: string; name: string; price: number }[]
}

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

export function ShopPlanCard({ shopId, activePlanId, plans }: ShopPlanCardProps) {
  const router = useRouter()
  const [selectedPlanId, setSelectedPlanId] = useState(activePlanId ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await adminSetShopPlan(shopId, selectedPlanId || null)
        toast.add({ title: 'Plan actualizado', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos cambiar el plan', type: 'error' })
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CreditCard className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="text-sm font-medium text-muted-foreground">Plan de suscripción</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <select
          value={selectedPlanId}
          onChange={(event) => setSelectedPlanId(event.target.value)}
          aria-label="Plan de suscripción"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Free (sin plan)</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} · {formatMoney(plan.price)}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={isPending || selectedPlanId === (activePlanId ?? '')}
          onClick={handleSave}
        >
          {isPending ? 'Guardando...' : 'Guardar plan'}
        </Button>
      </CardContent>
    </Card>
  )
}
