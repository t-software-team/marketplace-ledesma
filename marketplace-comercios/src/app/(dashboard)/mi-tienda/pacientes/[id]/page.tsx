import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { getPatient } from '@/lib/patients/queries'
import { calculateAge } from '@/lib/patients/age'
import { getPatientTreatments, getTreatmentTemplatesWithDoses } from '@/lib/treatments/queries'
import { getPatientAppointments } from '@/lib/turnos/queries'
import { listPatientReminders } from '@/lib/patients/reminders-queries'
import { BackLink } from '@/components/shared/back-link'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { ApplyTreatmentDialog } from './apply-treatment-dialog'
import { TreatmentHistory } from './treatment-history'
import { AppointmentHistory } from './appointment-history'
import { AddReminderDialog } from './add-reminder-dialog'
import { ReminderList } from './reminder-list'

interface PatientDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tratamiento?: string }>
}

// Detalle de paciente: ficha básica (PR1) + sección de Tratamientos
// aplicados (PR2) con botón para registrar una nueva aplicación y el
// historial con su status derivado (al día/próximo/vencido).
export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  const { id } = await params
  const { tratamiento } = await searchParams
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

  const [treatments, templates, appointments, reminders] = await Promise.all([
    getPatientTreatments(patient.id),
    getTreatmentTemplatesWithDoses(shop.id),
    getPatientAppointments(patient.id),
    listPatientReminders(patient.id),
  ])

  const age = calculateAge(patient.birth_date)

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
          <dt className="text-xs text-muted-foreground">Edad</dt>
          <dd>{age ?? (patient.birth_date ?? '—')}</dd>
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
          <dd className="flex items-center gap-2">
            {patient.owner_phone ?? '—'}
            {patient.owner_phone && (
              <WhatsAppButton
                phoneNumber={patient.owner_phone}
                message={`Hola ${patient.owner_name ?? ''}, te contactamos por ${patient.name}`}
                iconOnly
                variant="outline"
              />
            )}
          </dd>
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

      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-base">Tratamientos aplicados</h2>
          <ApplyTreatmentDialog
            patientId={patient.id}
            templates={templates}
            defaultOpen={tratamiento === 'nuevo'}
          />
        </div>
        <TreatmentHistory patientId={patient.id} treatments={treatments} />
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-base">Recordatorios</h2>
          <AddReminderDialog patientId={patient.id} />
        </div>
        <ReminderList patientId={patient.id} reminders={reminders} />
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h2 className="font-heading text-base">Historial de turnos</h2>
        <AppointmentHistory appointments={appointments} />
      </div>
    </div>
  )
}
