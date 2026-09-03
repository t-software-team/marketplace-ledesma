'use client'

import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { updatePatientNote, type PatientNoteActionState } from '@/lib/patients/notes-actions'
import { NOTE_CATEGORY_OPTIONS } from '@/lib/patients/note-categories'
import type { PatientNoteRow } from '@/lib/patients/notes-queries'

interface EditNoteDialogProps {
  patientId: string
  note: PatientNoteRow
}

const initialState: PatientNoteActionState = { error: null }

/**
 * Reutiliza el layout de `AddNoteDialog` (contenido + categoría) en modo
 * edición, sin la sección de adjuntos — los adjuntos no se editan acá.
 */
export function EditNoteDialog({ patientId, note }: EditNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<PatientNoteActionState>(initialState)
  const [isPending, startTransition] = useTransition()
  const fieldErrors = state.fieldErrors ?? {}

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePatientNote(note.id, patientId, initialState, formData)
      setState(result)
      if (result.error) {
        toast.add({ title: 'No pudimos actualizar la nota', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Nota actualizada', type: 'success' })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Editar nota" />}>
        <Pencil className="size-4" aria-hidden />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar nota</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-content" className="text-sm font-medium">
              Contenido
            </label>
            <Textarea
              id="edit-content"
              name="content"
              required
              defaultValue={note.content}
              aria-invalid={Boolean(fieldErrors.content)}
              rows={5}
            />
            <FieldError message={fieldErrors.content} />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-category" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="edit-category"
              name="category"
              defaultValue={note.category}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {NOTE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.category} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
