import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Duración</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <p className="truncate font-medium">{plan.name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {KIND_LABELS[plan.kind]} · {plan.duration_days} día
                    {plan.duration_days === 1 ? '' : 's'}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={plan.is_active ? 'default' : 'outline'}>
                    {KIND_LABELS[plan.kind]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                  {plan.duration_days} día{plan.duration_days === 1 ? '' : 's'}
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatARS(plan.price)}</TableCell>
                <TableCell>
                  {plan.is_active ? (
                    <Badge variant="default">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PlanRowActions planId={plan.id} isActive={plan.is_active} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
