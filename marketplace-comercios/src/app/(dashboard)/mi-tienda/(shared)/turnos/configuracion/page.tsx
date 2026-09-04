import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isGymRubro, isServiceRubro } from '@/lib/category-icons'
import { getBookingSettings } from '@/lib/turnos/queries'
import { BookingSettingsForm } from './booking-settings-form'

export default async function TurnosConfiguracionPage() {
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

  const settings = await getBookingSettings(shop.id)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading">Configuración de turnos</h1>
      <p className="text-sm text-muted-foreground">
        Definí los días y horarios en que aceptás turnos, y la duración de cada uno.
      </p>
      <BookingSettingsForm shopId={shop.id} settings={settings} />
    </div>
  )
}
