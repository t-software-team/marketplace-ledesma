import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { StatusBadge } from '@/components/shared/status-badge'
import { getShopReports } from '@/lib/admin/queries'
import { ReportActions } from './report-actions'
import type { Database } from '@/types/database.types'

type ReportReason = Database['public']['Enums']['report_reason']

const REASON_LABEL: Record<ReportReason, string> = {
  fake_product: 'Producto falso',
  scam: 'Estafa',
  inappropriate: 'Contenido inapropiado',
  closed_permanently: 'Cerrado permanentemente',
  other: 'Otro',
}

export default async function AdminReportsPage() {
  const reports = await getShopReports()

  const pending = reports.filter((report) => report.status === 'pending')
  const reviewed = reports.filter((report) => report.status !== 'pending')

  function renderReport(report: (typeof reports)[number]) {
    const reporterName = report.reported_by_profile?.full_name ?? 'Anónimo'

    return (
      <Card key={report.id}>
        <CardContent className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-medium">{report.shops?.name ?? 'Comercio'}</p>
            <p className="text-sm text-muted-foreground">{REASON_LABEL[report.reason]}</p>
            {report.comment && <p className="text-sm">{report.comment}</p>}
            <p className="text-xs text-muted-foreground">
              Reportado por {reporterName} el{' '}
              {new Date(report.created_at).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={report.status} />
            {report.status === 'pending' && <ReportActions reportId={report.id} />}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Reportes</h1>
        <p className="text-sm text-muted-foreground">Reportes de comercios enviados por usuarios</p>
      </div>

      <Tabs defaultValue="pendientes">
        <TabsList>
          <TabsTrigger value="pendientes">Pendientes ({pending.length})</TabsTrigger>
          <TabsTrigger value="revisados">Revisados</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-3 pt-2">
          {pending.length === 0 ? (
            <EmptyState illustration={<EmptyBoxIllustration />} message="No hay reportes pendientes." />
          ) : (
            <div className="space-y-3">{pending.map(renderReport)}</div>
          )}
        </TabsContent>

        <TabsContent value="revisados" className="space-y-3 pt-2">
          {reviewed.length === 0 ? (
            <EmptyState illustration={<EmptyBoxIllustration />} message="Todavía no hay reportes revisados." />
          ) : (
            <div className="space-y-3">{reviewed.map(renderReport)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
