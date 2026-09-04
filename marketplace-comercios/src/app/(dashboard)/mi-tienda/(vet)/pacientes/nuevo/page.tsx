import { redirect } from 'next/navigation'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { createPatient } from '@/lib/patients/actions'
import { BackLink } from '@/components/shared/back-link'
import { PatientForm } from '../patient-form'

export default async function NewPatientPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  if (!isVeterinariaRubro(shop.categories?.slug)) {
    redirect('/mi-tienda')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/pacientes" />
      <h1 className="text-2xl font-heading">Nuevo paciente</h1>
      <PatientForm shopId={shop.id} action={createPatient} submitLabel="Crear paciente" />
    </div>
  )
}
