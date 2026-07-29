import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { getAuditLog } from '@/lib/admin/queries'
import { AuditTable } from './audit-table'

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
        <AuditTable entries={entries} />
      )}
    </div>
  )
}
