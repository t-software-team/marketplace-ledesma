import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getMyGymAccess,
  getTodayAccessLog,
  GYM_ACCESS_SOURCE_LABEL,
  type GymAccessOutcome,
} from '@/lib/gym/queries'
import { CheckInClient } from './check-in-client'
import { SelfCheckinLaunch } from './self-checkin-launch'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

const OUTCOME: Record<
  GymAccessOutcome,
  { label: string; variant: 'success' | 'warning' | 'outline' }
> = {
  allowed: { label: 'Ingresó', variant: 'success' },
  denied_expired: { label: 'Vencida', variant: 'warning' },
  denied_not_found: { label: 'No encontrado', variant: 'outline' },
}

export default async function IngresosPage() {
  const access = await getMyGymAccess()
  if (!access) redirect('/mi-tienda')
  const { shopId, role } = access

  const log = await getTodayAccessLog(shopId)
  const allowed = log.filter((r) => r.outcome === 'allowed').length
  const deniedExpired = log.filter((r) => r.outcome === 'denied_expired').length
  const deniedNotFound = log.filter((r) => r.outcome === 'denied_not_found').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading">Ingresos</h1>
          <p className="text-sm text-muted-foreground">
            Buscá al socio y registrá su entrada. Te avisamos si su membresía está vigente o vencida. Los que ya ingresaron hoy no vuelven a aparecer.
          </p>
        </div>
        {role === 'owner' && <SelfCheckinLaunch />}
      </div>

      <Card>
        <CardContent className="pt-6">
          <CheckInClient />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad de hoy</CardTitle>
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
            <span>{allowed} ingresos</span>
            {deniedExpired > 0 && <span>· {deniedExpired} denegados por vencida</span>}
            {deniedNotFound > 0 && <span>· {deniedNotFound} sin socio</span>}
          </div>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hubo actividad hoy.</p>
          ) : (
            <div className="space-y-1">
              {log.map((row) => {
                const cfg = OUTCOME[row.outcome]
                const label =
                  row.member_name ?? (row.attempted_ref ? `Nº ${row.attempted_ref}` : 'Desconocido')
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="truncate">{label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      <span>{GYM_ACCESS_SOURCE_LABEL[row.source].toLowerCase()}</span>
                      <span className="font-mono">{formatTime(row.checked_in_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
