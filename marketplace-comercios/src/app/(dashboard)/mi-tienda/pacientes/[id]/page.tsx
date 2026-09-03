import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { getPatient } from '@/lib/patients/queries'
import { BackLink } from '@/components/shared/back-link'
import { Button } from '@/components/ui/button'

interface PatientDetailPageProps {
  params: Promise<{ id: string }>
}

// Shell del detalle de paciente: PR1 solo muestra la ficha básica. El
// historial de tratamientos (aplicar/consultar) se agrega en PR2, dentro de
// esta misma página.
export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
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

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/pacientes" />
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-heading">{patient.name}</h1>
        <Button
          render={<Link href={`/mi-tienda/pacientes/${patient.id}/editar`} />}
          nativeButton={false}
          variant="outline"
          size="sm"
        >
          <Pencil className="size-4" aria-hidden />
          Editar
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Especie</dt>
          <dd>{patient.species ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Raza</dt>
          <dd>{patient.breed ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sexo</dt>
          <dd>{patient.sex ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Nacimiento</dt>
          <dd>{patient.birth_date ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Peso</dt>
          <dd>{patient.weight != null ? `${patient.weight} kg` : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Dueño</dt>
          <dd>{patient.owner_name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Teléfono</dt>
          <dd>{patient.owner_phone ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Email</dt>
          <dd>{patient.owner_email ?? '—'}</dd>
        </div>
      </dl>

      {patient.notes && (
        <div>
          <h2 className="text-xs text-muted-foreground">Notas</h2>
          <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
        </div>
      )}
    </div>
  )
}
