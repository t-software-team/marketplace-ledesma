import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendAreaChart } from '@/components/shared/trend-area-chart'
import { getGymBenefits } from '@/lib/shops/queries'
import { getGymReport, getMyShopId, GYM_REPORT_MAX_DAYS } from '@/lib/gym/queries'
import { resolveGymReportRange } from '@/lib/gym/report-range'
import { argentinaToday } from '@/lib/timezone'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateLabel(value: string) {
  const [, mm, dd] = value.split('-')
  return `${dd}/${mm}`
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const params = await searchParams
  const range = resolveGymReportRange(params.from, params.to)

  const benefits = await getGymBenefits(shopId)
  if (!benefits.stats) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-heading">Reportes</h1>
          <p className="text-sm text-muted-foreground">Asistencia e ingresos por rango de fecha.</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm font-medium">Reportes por fecha</p>
              <p className="text-xs text-muted-foreground">
                Mirá asistencia e ingresos de cualquier período con el Plan Gimnasio.
              </p>
            </div>
            <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false} variant="outline" size="sm">
              Ver Plan Gimnasio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const report = await getGymReport(shopId, range.from, range.to)
  const chartData = report.daily.map((d) => ({ date: formatDateLabel(d.date), ingresos: d.allowed }))
  const revenueTotal = report.totals.revenue_cash + report.totals.revenue_transfer + report.totals.revenue_mercadopago
  const exportHref = `/api/gym/export/reportes?from=${range.from}&to=${range.to}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading">Reportes</h1>
          <p className="text-sm text-muted-foreground">Asistencia e ingresos por rango de fecha.</p>
        </div>
        {benefits.exportCsv && (
          <Button render={<Link href={exportHref} />} nativeButton={false} variant="outline" size="sm">
            <Download className="mr-2 size-4" aria-hidden />
            Exportar CSV
          </Button>
        )}
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
                max={argentinaToday()}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <Button type="submit" size="sm">
              Filtrar
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Rango máximo: {GYM_REPORT_MAX_DAYS} días.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="font-heading text-xl">{report.totals.allowed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Denegados (vencida)</p>
            <p className="font-heading text-xl">{report.totals.denied_expired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Denegados (sin socio)</p>
            <p className="font-heading text-xl">{report.totals.denied_not_found}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Ingresos ($) del período</p>
            <p className="font-heading text-xl text-primary">{formatARS(revenueTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Mostrador</p>
            <p className="font-heading text-lg">{report.totals.by_source.desk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Autoingreso</p>
            <p className="font-heading text-lg">{report.totals.by_source.self}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Autoingreso (offline)</p>
            <p className="font-heading text-lg">{report.totals.by_source.self_offline}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <p className="text-sm font-medium">Asistencia</p>
            <p className="text-xs text-muted-foreground">
              Ingresos por día — {formatDateLabel(range.from)} a {formatDateLabel(range.to)}
            </p>
          </div>
          <TrendAreaChart
            data={chartData}
            dataKey="ingresos"
            label="Ingresos"
            gradientId="gymReport"
            variant="pulse"
          />
        </CardContent>
      </Card>
    </div>
  )
}
