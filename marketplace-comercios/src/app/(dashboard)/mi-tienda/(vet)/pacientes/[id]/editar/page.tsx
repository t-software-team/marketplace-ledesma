import { notFound, redirect } from 'next/navigation'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { getPatient } from '@/lib/patients/queries'
import { updatePatient } from '@/lib/patients/actions'
import { BackLink } from '@/components/shared/back-link'
import { PatientForm } from '../../patient-form'

interface EditPatientPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = await params
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  if (!isVeterinariaRubro(shop.categories?.slug)) {
    redirect('/mi-tienda')
  }

  const patient = await getPatient(shop.id, id)

  if (!patient) {
    notFound()
  }

  const updatePatientWithId = updatePatient.bind(null, patient.id)

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/pacientes" />
      <h1 className="text-2xl font-heading">Editar paciente</h1>
      <PatientForm
        shopId={shop.id}
        action={updatePatientWithId}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: patient.name,
          species: patient.species,
          breed: patient.breed,
          sex: patient.sex,
          birth_date: patient.birth_date,
          weight: patient.weight,
          photo_url: patient.photo_url,
          owner_name: patient.owner_name,
          owner_email: patient.owner_email,
          owner_phone: patient.owner_phone,
        }}
      />
    </div>
  )
}
