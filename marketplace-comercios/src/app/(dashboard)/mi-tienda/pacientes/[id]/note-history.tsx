'use client'

import Image from 'next/image'
import { Trash2, FileText } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deletePatientNote } from '@/lib/patients/notes-actions'
import { NOTE_CATEGORY_LABELS, NOTE_CATEGORY_OPTIONS } from '@/lib/patients/note-categories'
import { isImageAttachment } from '@/lib/patients/note-attachment-utils'
import { filterNotes, NOTE_CATEGORY_FILTER_ALL } from '@/lib/patients/note-filters'
import type { PatientNoteCategory } from '@/lib/validations/patients'
import type { PatientNoteAttachmentRow, PatientNoteRow } from '@/lib/patients/notes-queries'
import { EditNoteDialog } from './edit-note-dialog'

interface NoteHistoryProps {
  shopId: string
  patientId: string
  notes: PatientNoteRow[]
}

function NoteAttachment({ attachment }: { attachment: PatientNoteAttachmentRow }) {
  if (isImageAttachment(attachment.file_name)) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="inline-block overflow-hidden rounded-lg border border-border"
      >
        <Image
          src={attachment.url}
          alt={attachment.file_name}
          width={80}
          height={80}
          className="size-20 object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-2 hover:underline"
    >
      <FileText className="size-3.5" aria-hidden />
      {attachment.file_name}
    </a>
  )
}

export function NoteHistory({ shopId, patientId, notes }: NoteHistoryProps) {
  const [isPending, startTransition] = useTransition()
  const [categoryFilter, setCategoryFilter] = useState<PatientNoteCategory | typeof NOTE_CATEGORY_FILTER_ALL>(
    NOTE_CATEGORY_FILTER_ALL
  )
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredNotes = useMemo(
    () =>
      filterNotes(notes, {
        categoryFilter,
        startDate: startDate || null,
        endDate: endDate || null,
      }),
    [notes, categoryFilter, startDate, endDate]
  )

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label htmlFor="note-category-filter" className="text-xs font-medium text-muted-foreground">
            Categoría
          </label>
          <select
            id="note-category-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as PatientNoteCategory | typeof NOTE_CATEGORY_FILTER_ALL)
            }
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value={NOTE_CATEGORY_FILTER_ALL}>Todas</option>
            {NOTE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="note-start-date" className="text-xs font-medium text-muted-foreground">
            Desde
          </label>
          <input
            id="note-start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="note-end-date" className="text-xs font-medium text-muted-foreground">
            Hasta
          </label>
          <input
            id="note-end-date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm"
          />
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguna nota coincide con el filtro.</p>
      ) : (
        <ul className="space-y-2">
          {filteredNotes.map((note) => (
            <li key={note.id} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{NOTE_CATEGORY_LABELS[note.category]}</Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleString('es-AR')}
                    {note.author_name ? ` · ${note.author_name}` : ''}
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
                <ul className="flex flex-wrap gap-2">
                  {note.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <NoteAttachment attachment={attachment} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
