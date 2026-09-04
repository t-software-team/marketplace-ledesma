import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Banknote, ArrowLeftRight, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import {
  getGymDashboardStats,
  getGymPaymentsPage,
  getMyShopId,
  type GymPaymentMethod,
} from '@/lib/gym/queries'
import { resolveGymReportRange } from '@/lib/gym/report-range'
import { getGymBenefits } from '@/lib/shops/queries'
import { VoidPaymentDialog } from './void-payment-dialog'

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

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; search?: string; page?: string }>
}) {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const params = await searchParams
  const range = resolveGymReportRange(params.from, params.to)
  const search = params.search?.trim() || undefined
  const page = Math.max(1, Number(params.page) || 1)

  const [stats, { payments, total, totalPages }, benefits] = await Promise.all([
    getGymDashboardStats(shopId),
    getGymPaymentsPage(shopId, { from: range.from, to: range.to, search, page }),
    getGymBenefits(shopId),
  ])

  const monthTotal = stats.revenue_month_cash + stats.revenue_month_transfer

  const filterQuery = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ from: range.from, to: range.to, ...(search ? { search } : {}), ...extra })
    return `?${p.toString()}`
  }
  const exportHref = `/api/gym/export/caja?from=${range.from}&to=${range.to}${search ? `&search=${encodeURIComponent(search)}` : ''}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading">Caja</h1>
          <p className="text-sm text-muted-foreground">
            Cada alta y renovación registra el cobro. Hoy en efectivo o transferencia; Mercado Pago se
            suma más adelante.
          </p>
        </div>
        {benefits.exportCsv && (
          <Button render={<Link href={exportHref} />} nativeButton={false} variant="outline" size="sm">
            <Download className="mr-2 size-4" aria-hidden />
            Exportar CSV
          </Button>
        )}
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

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="space-y-1">
              <label htmlFor="from" className="text-sm font-medium">
                Desde
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={range.from}
                max={range.to}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="to" className="text-sm font-medium">
                Hasta
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={range.to}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="search" className="text-sm font-medium">
                Socio
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Buscar por nombre…"
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <Button type="submit" size="sm">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <EmptyState message="No hay cobros que coincidan con el filtro." />
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => {
            const isVoided = payment.status === 'voided'
            return (
              <div
                key={payment.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 ${isVoided ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0">
                  <p className={`truncate font-medium ${isVoided ? 'line-through' : ''}`}>
                    {payment.member_name ?? 'Socio'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.paid_at ?? payment.created_at).toLocaleDateString('es-AR')}
                    {isVoided && payment.void_reason ? ` · Anulado: ${payment.void_reason}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isVoided ? 'outline' : 'outline'}>{METHOD_LABELS[payment.method]}</Badge>
                  <span className={`font-heading ${isVoided ? 'line-through' : ''}`}>
                    {formatARS(payment.amount)}
                  </span>
                  {!isVoided && (
                    <VoidPaymentDialog paymentId={payment.id} amountLabel={formatARS(payment.amount)} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} resultados
          </p>
          <div className="flex gap-2">
            <Button
              render={<Link href={filterQuery({ page: String(page - 1) })} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className={`gap-1 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Anterior
            </Button>
            <Button
              render={<Link href={filterQuery({ page: String(page + 1) })} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className={`gap-1 ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
