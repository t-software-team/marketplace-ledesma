import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
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
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <Badge variant={ACTION_VARIANT[entry.action] ?? 'outline'}>
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {entry.actor?.full_name ?? 'Usuario desconocido'} · {entry.target_table} ·{' '}
                    {entry.target_id}
                  </p>
                  {entry.metadata != null && (
                    <p className="truncate text-xs text-muted-foreground">
                      {JSON.stringify(entry.metadata)}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
