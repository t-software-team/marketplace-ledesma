'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createPatientReminder, type PatientReminderActionState } from '@/lib/patients/reminders-actions'

interface AddReminderDialogProps {
  patientId: string
  defaultOpen?: boolean
}

const initialState: PatientReminderActionState = { error: null }

export function AddReminderDialog({ patientId, defaultOpen = false }: AddReminderDialogProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [state, setState] = useState<PatientReminderActionState>(initialState)
  const [isPending, startTransition] = useTransition()
  const fieldErrors = state.fieldErrors ?? {}

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPatientReminder(patientId, initialState, formData)
      setState(result)
      if (result.error) {
        toast.add({ title: 'No pudimos crear el recordatorio', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Recordatorio creado', type: 'success' })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nuevo recordatorio</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo recordatorio</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="label" className="text-sm font-medium">
              Texto del recordatorio
            </label>
            <Input id="label" name="label" required aria-invalid={Boolean(fieldErrors.label)} />
            <FieldError message={fieldErrors.label} />
          </div>

          <div className="space-y-2">
            <label htmlFor="due_at" className="text-sm font-medium">
              Fecha
            </label>
            <Input
              id="due_at"
              name="due_at"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
              aria-invalid={Boolean(fieldErrors.due_at)}
            />
            <FieldError message={fieldErrors.due_at} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Crear'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
