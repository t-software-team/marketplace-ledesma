'use client'

import { Trash2, FileText } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deletePatientNote } from '@/lib/patients/notes-actions'
import { NOTE_CATEGORY_LABELS } from '@/lib/patients/note-categories'
import type { PatientNoteRow } from '@/lib/patients/notes-queries'
import { EditNoteDialog } from './edit-note-dialog'

interface NoteHistoryProps {
  shopId: string
  patientId: string
  notes: PatientNoteRow[]
}

export function NoteHistory({ shopId, patientId, notes }: NoteHistoryProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const result = await deletePatientNote(noteId, patientId)
      if (result.error) {
        console.error('NoteHistory: fallo al eliminar la nota', { noteId, patientId, error: result.error })
        toast.add({ title: 'No pudimos eliminar la nota', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Nota eliminada', type: 'success' })
      }
    })
  }

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay notas cargadas.</p>
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <li key={note.id} className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{NOTE_CATEGORY_LABELS[note.category]}</Badge>
              <p className="text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleString('es-AR')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <EditNoteDialog shopId={shopId} patientId={patientId} note={note} />
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon-sm" disabled={isPending} aria-label="Eliminar" />}
                triggerLabel={<Trash2 className="size-4" aria-hidden />}
                title="¿Eliminar esta nota?"
                description="Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                isConfirming={isPending}
                onConfirm={() => handleDelete(note.id)}
              />
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
          {note.attachments.length > 0 && (
            <ul className="space-y-1">
              {note.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    <FileText className="size-3.5" aria-hidden />
                    {attachment.file_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
