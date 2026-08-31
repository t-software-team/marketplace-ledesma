import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyDumbbellIllustration } from '@/components/shared/empty-illustrations'
import { getGymPlans, getMyShopId, type GymPlanKind } from '@/lib/gym/queries'
import { PlanForm } from './plan-form'
import { PlanRowActions } from './plan-row-actions'

const KIND_LABELS: Record<GymPlanKind, string> = {
  daily: 'Diario',
  multi_day: 'Por días',
  monthly: 'Mensual',
  custom: 'Personalizado',
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function PlanesPage() {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const plans = await getGymPlans(shopId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Definí las modalidades que ofrece tu gimnasio: un pase diario, por días o el plan mensual.
          Cada plan dura una cantidad de días, y el vencimiento se calcula solo al dar de alta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm />
        </CardContent>
      </Card>

      {plans.length === 0 ? (
        <EmptyState
          illustration={<EmptyDumbbellIllustration />}
          message="Todavía no cargaste ningún plan. Creá el primero para poder dar de alta socios."
        />
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{plan.name}</p>
                  <Badge variant={plan.is_active ? 'default' : 'outline'}>
                    {KIND_LABELS[plan.kind]}
                  </Badge>
                  {!plan.is_active && <Badge variant="outline">Inactivo</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.duration_days} día{plan.duration_days === 1 ? '' : 's'} ·{' '}
                  {formatARS(plan.price)}
                </p>
              </div>
              <PlanRowActions planId={plan.id} isActive={plan.is_active} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
