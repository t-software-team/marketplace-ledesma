import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { PaginatedSection } from '@/components/shared/paginated-section'
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

  function renderTable(list: typeof reports, emptyMessage: string) {
    if (list.length === 0) {
      return <EmptyState illustration={<EmptyBoxIllustration />} message={emptyMessage} />
    }

    return (
      <PaginatedSection items={list} pageSize={10}>
        {(pageReports) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comercio</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Reportado por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageReports.map((report) => {
                const reporterName = report.reported_by_profile?.full_name ?? 'Anónimo'
                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.shops?.name ?? 'Comercio'}</TableCell>
                    <TableCell>
                      {REASON_LABEL[report.reason]}
                      {report.comment && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                          {report.comment}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {reporterName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {report.status === 'pending' && <ReportActions reportId={report.id} />}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </PaginatedSection>
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
          {renderTable(pending, 'No hay reportes pendientes.')}
        </TabsContent>

        <TabsContent value="revisados" className="space-y-3 pt-2">
          {renderTable(reviewed, 'Todavía no hay reportes revisados.')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
