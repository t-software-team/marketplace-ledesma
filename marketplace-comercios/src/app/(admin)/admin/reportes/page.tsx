import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { getShopReports } from '@/lib/admin/queries'
import { ReportsTable } from './reports-table'

export default async function AdminReportsPage() {
  const reports = await getShopReports()

  const pending = reports.filter((report) => report.status === 'pending')
  const reviewed = reports.filter((report) => report.status !== 'pending')

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
            <ReportsTable reports={pending} />
          )}
        </TabsContent>

        <TabsContent value="revisados" className="space-y-3 pt-2">
          {reviewed.length === 0 ? (
            <EmptyState
              illustration={<EmptyBoxIllustration />}
              message="Todavía no hay reportes revisados."
            />
          ) : (
            <ReportsTable reports={reviewed} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
