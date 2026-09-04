import { Badge } from '@/components/ui/badge'
import type { AppointmentRow } from '@/lib/turnos/queries'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No se presentó',
  blocked: 'Bloqueado',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'destructive',
  cancelled: 'outline',
  completed: 'success',
  no_show: 'destructive',
  blocked: 'outline',
}

interface AppointmentHistoryProps {
  appointments: AppointmentRow[]
}

export function AppointmentHistory({ appointments }: AppointmentHistoryProps) {
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay turnos registrados.</p>
  }

  return (
    <ul className="space-y-2">
      {appointments.map((appointment) => (
        <li
          key={appointment.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {new Date(appointment.starts_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <Badge variant={STATUS_VARIANT[appointment.status] ?? 'outline'}>
                {STATUS_LABELS[appointment.status] ?? appointment.status}
              </Badge>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
