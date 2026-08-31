import { redirect } from 'next/navigation'
import { Banknote, ArrowLeftRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import {
  getGymDashboardStats,
  getGymPayments,
  getMyShopId,
  type GymPaymentMethod,
} from '@/lib/gym/queries'

const METHOD_LABELS: Record<GymPaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function CajaPage() {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const [stats, payments] = await Promise.all([
    getGymDashboardStats(shopId),
    getGymPayments(shopId, 60),
  ])

  const monthTotal = stats.revenue_month_cash + stats.revenue_month_transfer

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Caja</h1>
        <p className="text-sm text-muted-foreground">
          Cada alta y renovación registra el cobro. Hoy en efectivo o transferencia; Mercado Pago se
          suma más adelante.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
            <Banknote className="size-4 text-muted-foreground" aria-hidden />
            <p className="truncate text-xs text-muted-foreground">Efectivo (mes)</p>
            <p className="font-heading text-lg sm:text-xl">{formatARS(stats.revenue_month_cash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
            <ArrowLeftRight className="size-4 text-muted-foreground" aria-hidden />
            <p className="truncate text-xs text-muted-foreground">Transferencia (mes)</p>
            <p className="font-heading text-lg sm:text-xl">
              {formatARS(stats.revenue_month_transfer)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
            <p className="truncate text-xs text-muted-foreground">Total del mes</p>
            <p className="font-heading text-lg text-primary sm:text-xl">{formatARS(monthTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <EmptyState message="Todavía no registraste cobros. Al dar de alta un socio con plan, el pago aparece acá." />
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{payment.member_name ?? 'Socio'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.paid_at ?? payment.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{METHOD_LABELS[payment.method]}</Badge>
                <span className="font-heading">{formatARS(payment.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
