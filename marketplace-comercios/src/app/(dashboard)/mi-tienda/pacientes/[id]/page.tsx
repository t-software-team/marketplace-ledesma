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
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        'lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0'
      )}
    >
      {patient.owner_phone && (
        <WhatsAppButton
          phoneNumber={patient.owner_phone}
          message={`Hola ${patient.owner_name ?? ''}, te contactamos por ${patient.name}`}
          variant="outline"
          compact
          className="h-7 flex-1 justify-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] lg:flex-none [&_svg]:size-3.5"
        />
      )}
      <Button
        render={<Link href={`/mi-tienda/pacientes/${patient.id}/editar`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        className="flex-1 justify-center lg:flex-none"
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
    <div className="max-w-3xl space-y-4 pb-20 lg:pb-0">
      <BackLink href="/mi-tienda/pacientes" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <SpeciesIcon
              species={patient.species}
              className="size-6 shrink-0 text-muted-foreground"
              aria-hidden
            />
            {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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

          <div className="border-t border-border pt-4">{quickActions}</div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tratamientos aplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <TreatmentHistory patientId={patient.id} treatments={treatments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recordatorios</CardTitle>
            <CardAction>
              <AddReminderDialog patientId={patient.id} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ReminderList
              patientId={patient.id}
              reminders={reminders}
              patientName={patient.name}
              ownerName={patient.owner_name}
              ownerPhone={patient.owner_phone}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial clínico</CardTitle>
            <CardAction>
              <AddNoteDialog shopId={shop.id} patientId={patient.id} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <NoteHistory shopId={shop.id} patientId={patient.id} notes={notes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentHistory appointments={appointments} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
