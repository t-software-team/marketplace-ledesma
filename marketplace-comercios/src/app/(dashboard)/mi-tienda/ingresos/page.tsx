import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { getMyGymAccess, getTodayAccessLog } from '@/lib/gym/queries'
import { CheckInClient } from './check-in-client'
import { SelfCheckinLaunch } from './self-checkin-launch'
import { TodayAccessLog } from './today-access-log'

export default async function IngresosPage() {
  const access = await getMyGymAccess()
  if (!access) redirect('/mi-tienda')
  const { shopId, role } = access

  const log = await getTodayAccessLog(shopId)

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

      <TodayAccessLog shopId={shopId} initialLog={log} />
    </div>
  )
}
