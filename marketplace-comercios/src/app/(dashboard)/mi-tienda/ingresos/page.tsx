import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getGymMembers, getMyShopId, getTodayCheckIns } from '@/lib/gym/queries'
import { CheckInClient } from './check-in-client'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default async function IngresosPage() {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const [members, todayCheckIns] = await Promise.all([
    getGymMembers(shopId, { limit: 500 }),
    getTodayCheckIns(shopId),
  ])

  const searchable = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    status: m.status,
    expires_at: m.expires_at,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Ingresos</h1>
        <p className="text-sm text-muted-foreground">
          Buscá al socio y registrá su entrada. Te avisamos si su membresía está vigente o vencida.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CheckInClient members={searchable} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ingresos de hoy{todayCheckIns.length > 0 ? ` (${todayCheckIns.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayCheckIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hubo ingresos hoy.</p>
          ) : (
            <div className="space-y-1">
              {todayCheckIns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm last:border-0"
                >
                  <span className="truncate">{c.member_name ?? 'Socio'}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(c.checked_in_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
