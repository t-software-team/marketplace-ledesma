import { createClient } from '@/lib/supabase/server'
import type { PatientNoteCategory } from '@/lib/validations/patients'

export interface PatientNoteAttachmentRow {
  id: string
  note_id: string
  url: string
  file_name: string
  created_at: string
}

export interface PatientNoteRow {
  id: string
  patient_id: string
  content: string
  category: PatientNoteCategory
  created_at: string
  updated_at: string
  attachments: PatientNoteAttachmentRow[]
}

const NOTE_COLUMNS = 'id, patient_id, content, category, created_at, updated_at'
const ATTACHMENT_COLUMNS = 'id, note_id, url, file_name, created_at'

/**
 * Notas de un paciente con sus adjuntos agrupados. Segunda query separada
 * (en vez de un join anidado en el select) porque es el enfoque más simple:
 * las notas suelen ser pocas por paciente y evita lidiar con el shape
 * anidado que devuelve PostgREST para relaciones 1-a-muchos.
 */
export async function listPatientNotes(patientId: string): Promise<PatientNoteRow[]> {
  const supabase = await createClient()

  const { data: notes, error } = await supabase
    .from('patient_notes')
    .select(NOTE_COLUMNS)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listPatientNotes: fallo al traer notas', { patientId, error })
    return []
  }

  if (!notes || notes.length === 0) return []

  const { data: attachments, error: attachmentsError } = await supabase
    .from('patient_note_attachments')
    .select(ATTACHMENT_COLUMNS)
    .in(
      'note_id',
      notes.map((note) => note.id)
    )
    .order('created_at', { ascending: true })

  if (attachmentsError) {
    console.error('listPatientNotes: fallo al traer adjuntos', { patientId, attachmentsError })
    return notes.map((note) => ({ ...note, category: note.category as PatientNoteCategory, attachments: [] }))
  }

  const attachmentsByNoteId = new Map<string, PatientNoteAttachmentRow[]>()
  for (const attachment of attachments ?? []) {
    const list = attachmentsByNoteId.get(attachment.note_id) ?? []
    list.push(attachment)
    attachmentsByNoteId.set(attachment.note_id, list)
  }

  return notes.map((note) => ({
    ...note,
    category: note.category as PatientNoteCategory,
    attachments: attachmentsByNoteId.get(note.id) ?? [],
  }))
}
