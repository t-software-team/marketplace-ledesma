import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { Suspense } from 'react'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { getShopPatients } from '@/lib/patients/queries'
import { getShopPatientAlertsMap } from '@/lib/patients/alerts'
import { getShopPatientTreatmentCounts } from '@/lib/treatments/queries'
import { PatientsList } from './patients-list'

interface PacientesPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function PacientesPage({ searchParams }: PacientesPageProps) {
  const { q } = await searchParams
  const search = q?.trim() || undefined
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  if (!isVeterinariaRubro(shop.categories?.slug)) {
    redirect('/mi-tienda')
  }

  const [patients, alertsMap, treatmentCounts] = await Promise.all([
    getShopPatients(shop.id, { search }),
    getShopPatientAlertsMap(shop.id),
    getShopPatientTreatmentCounts(shop.id),
  ])

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-heading">Pacientes</h1>
          <p className="text-xs text-muted-foreground">{patients.length} pacientes</p>
        </div>
        <Button render={<Link href="/mi-tienda/pacientes/nuevo" />} nativeButton={false}>
          Nuevo paciente
        </Button>
      </div>

      {patients.length === 0 && !search ? (
        <EmptyState
          illustration={<EmptyBoxIllustration />}
          message="Todavía no cargaste ningún paciente. Agregá el primero para empezar a llevar su historia."
          action={
            <Button render={<Link href="/mi-tienda/pacientes/nuevo" />} nativeButton={false} size="sm">
              Cargar paciente
            </Button>
          }
        />
      ) : (
        <PatientsList
          patients={patients}
          search={search}
          alertsMap={alertsMap}
          treatmentCounts={treatmentCounts}
        />
      )}
    </div>
  )
}
