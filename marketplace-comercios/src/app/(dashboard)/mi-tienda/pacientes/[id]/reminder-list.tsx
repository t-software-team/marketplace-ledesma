'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { toast } from '@/components/ui/toast'
import { deletePatientReminder } from '@/lib/patients/reminders-actions'
import type { PatientReminderRow } from '@/lib/patients/reminders-queries'

interface ReminderListProps {
  patientId: string
  reminders: PatientReminderRow[]
  patientName: string
  ownerName: string | null
  ownerPhone: string | null
}

export function ReminderList({
  patientId,
  reminders,
  patientName,
  ownerName,
  ownerPhone,
}: ReminderListProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(reminderId: string) {
    startTransition(async () => {
      const result = await deletePatientReminder(reminderId, patientId)
      if (result.error) {
        toast.add({ title: 'No pudimos eliminar el recordatorio', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Recordatorio eliminado', type: 'success' })
      }
    })
  }

  if (reminders.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay recordatorios cargados.</p>
  }

  return (
    <ul className="space-y-2">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{reminder.label}</span>
              <Badge variant={reminder.reminder_sent_at ? 'outline' : 'warning'}>
                {reminder.reminder_sent_at ? 'Enviado' : 'Pendiente'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Fecha: {new Date(reminder.due_at).toLocaleDateString('es-AR')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {ownerPhone && (
              <WhatsAppButton
                phoneNumber={ownerPhone}
                message={`Hola ${ownerName ?? ''}, te recordamos: ${reminder.label} para ${patientName}`}
                iconOnly
                variant="outline"
              />
            )}
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon-sm" disabled={isPending} aria-label="Eliminar" />}
              triggerLabel={<Trash2 className="size-4" aria-hidden />}
              title="¿Eliminar este recordatorio?"
              description="Esta acción no se puede deshacer."
              confirmLabel="Eliminar"
              isConfirming={isPending}
              onConfirm={() => handleDelete(reminder.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
