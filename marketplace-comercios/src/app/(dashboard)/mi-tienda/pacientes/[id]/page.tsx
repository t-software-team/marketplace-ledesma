import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { getPatient } from '@/lib/patients/queries'
import { calculateAge } from '@/lib/patients/age'
import { getPatientTreatments, getTreatmentTemplatesWithDoses } from '@/lib/treatments/queries'
import { getPatientAppointments } from '@/lib/turnos/queries'
import { listPatientReminders } from '@/lib/patients/reminders-queries'
import { listPatientNotes } from '@/lib/patients/notes-queries'
import { SpeciesIcon } from '@/lib/patients/species-icon'
import { BackLink } from '@/components/shared/back-link'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { CollapsibleSection } from '@/components/shared/collapsible-section'
import { ApplyTreatmentDialog } from './apply-treatment-dialog'
import { TreatmentHistory } from './treatment-history'
import { AppointmentHistory } from './appointment-history'
import { AddReminderDialog } from './add-reminder-dialog'
import { ReminderList } from './reminder-list'
import { AddNoteDialog } from './add-note-dialog'
import { NoteHistory } from './note-history'

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

  const [treatments, templates, appointments, reminders, notes] = await Promise.all([
    getPatientTreatments(patient.id),
    getTreatmentTemplatesWithDoses(shop.id),
    getPatientAppointments(patient.id),
    listPatientReminders(patient.id),
    listPatientNotes(patient.id),
  ])

  const age = calculateAge(patient.birth_date)

  const quickActions = (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-surface p-3',
        'lg:static lg:z-auto lg:flex-col lg:items-stretch lg:border-0 lg:bg-transparent lg:p-0'
      )}
    >
      {patient.owner_phone && (
        <WhatsAppButton
          phoneNumber={patient.owner_phone}
          message={`Hola ${patient.owner_name ?? ''}, te contactamos por ${patient.name}`}
          variant="outline"
          className="flex-1 justify-center lg:flex-none lg:justify-start"
        />
      )}
      <Button
        render={<Link href={`/mi-tienda/pacientes/${patient.id}/editar`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        className="flex-1 justify-center lg:flex-none lg:justify-start"
      >
        <Pencil className="size-4" aria-hidden />
        Editar
      </Button>
      <ApplyTreatmentDialog
        patientId={patient.id}
        templates={templates}
        defaultOpen={tratamiento === 'nuevo'}
      />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-4 pb-20 lg:max-w-none lg:pb-0">
      <BackLink href="/mi-tienda/pacientes" />

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-6">
        <div className="lg:sticky lg:top-6 lg:space-y-4">
          <div className="flex items-center justify-between gap-2 lg:block">
            <h1 className="flex items-center gap-2 text-2xl font-heading">
              <SpeciesIcon
                species={patient.species}
                className="size-6 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {patient.name}
            </h1>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm lg:mt-4 lg:grid-cols-1">
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
              <dd>{patient.owner_phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd>{patient.owner_email ?? '—'}</dd>
            </div>
          </dl>

          <div className="lg:mt-4">{quickActions}</div>
        </div>

        <div className="mt-4 space-y-1 lg:mt-0 xl:grid xl:grid-cols-2 xl:gap-x-6 xl:space-y-0">
          <CollapsibleSection title="Tratamientos aplicados" defaultOpen>
            <TreatmentHistory patientId={patient.id} treatments={treatments} />
          </CollapsibleSection>

          <CollapsibleSection title="Recordatorios" action={<AddReminderDialog patientId={patient.id} />}>
            <ReminderList
              patientId={patient.id}
              reminders={reminders}
              patientName={patient.name}
              ownerName={patient.owner_name}
              ownerPhone={patient.owner_phone}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Historial clínico"
            action={<AddNoteDialog shopId={shop.id} patientId={patient.id} />}
          >
            <NoteHistory shopId={shop.id} patientId={patient.id} notes={notes} />
          </CollapsibleSection>

          <CollapsibleSection title="Historial de turnos">
            <AppointmentHistory appointments={appointments} />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}
