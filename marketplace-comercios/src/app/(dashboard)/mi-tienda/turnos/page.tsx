import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isGymRubro, isServiceRubro, isVeterinariaRubro } from '@/lib/category-icons'
import { getShopAppointments, getShopAppointmentStats } from '@/lib/turnos/queries'
import { Button } from '@/components/ui/button'
import { AppointmentsTable } from './appointments-table'
import { TurnosStats } from './turnos-stats'

export default async function TurnosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: shop } = await supabase
    .from('shops')
    .select('id, categories ( slug )')
    .eq('owner_id', user.id)
    .maybeSingle()

  const rubroSlug = shop?.categories?.slug ?? null
  if (!shop || !isServiceRubro(rubroSlug) || isGymRubro(rubroSlug)) {
    redirect('/mi-tienda')
  }

  const [appointments, stats] = await Promise.all([
    getShopAppointments(shop.id),
    getShopAppointmentStats(shop.id),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">Turnos</h1>
        <Button render={<Link href="/mi-tienda/turnos/configuracion" />} nativeButton={false} variant="outline">
          Configurar disponibilidad
        </Button>
      </div>

      <TurnosStats stats={stats} />

      <AppointmentsTable
        shopId={shop.id}
        appointments={appointments}
        isVeterinaria={isVeterinariaRubro(rubroSlug)}
      />
    </div>
  )
}
