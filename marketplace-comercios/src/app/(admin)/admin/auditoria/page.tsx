import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { PaginatedSection } from '@/components/shared/paginated-section'
import { getAuditLog } from '@/lib/admin/queries'

const ACTION_LABEL: Record<string, string> = {
  shop_verified: 'Comercio verificado',
  shop_verification_rejected: 'Verificación rechazada',
  subscription_approved: 'Suscripción aprobada',
  subscription_rejected: 'Suscripción rechazada',
  report_reviewed: 'Reporte revisado',
  report_dismissed: 'Reporte descartado',
}

const ACTION_VARIANT: Record<string, 'success' | 'destructive' | 'warning'> = {
  shop_verified: 'success',
  shop_verification_rejected: 'destructive',
  subscription_approved: 'success',
  subscription_rejected: 'destructive',
  report_reviewed: 'success',
  report_dismissed: 'warning',
}

export default async function AdminAuditLogPage() {
  const entries = await getAuditLog()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Últimas acciones de moderación realizadas por el equipo administrador
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          illustration={<EmptyBoxIllustration />}
          message="Todavía no hay acciones registradas."
        />
      ) : (
        <PaginatedSection items={entries} pageSize={15}>
          {(pageEntries) => (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[entry.action] ?? 'outline'}>
                        {ACTION_LABEL[entry.action] ?? entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {entry.actor?.full_name ?? 'Usuario desconocido'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {entry.target_table} · {entry.target_id}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {entry.metadata != null ? JSON.stringify(entry.metadata) : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString('es-AR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </PaginatedSection>
      )}
    </div>
  )
}
