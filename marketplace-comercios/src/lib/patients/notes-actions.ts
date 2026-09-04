'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { getMyShop } from '@/lib/shops/queries'
import { patientNoteSchema } from '@/lib/validations/patients'

export type PatientNoteActionState = {
  error: string | null
  fieldErrors?: Record<string, string>
}

export interface PatientNoteAttachmentInput {
  url: string
  file_name: string
}

/**
 * Crea una nota de historial clínico + sus adjuntos en la misma operación
 * (mismo patrón que `insertTemplateWithDoses` en `treatments/actions.ts`:
 * insert del padre, insert de los hijos, rollback manual del padre si los
 * hijos fallan). `getMyShop()` + chequeo explícito de que el paciente
 * pertenece al comercio, mismo estilo que `reminders-actions.ts`.
 */
export async function createPatientNote(
  patientId: string,
  attachments: PatientNoteAttachmentInput[],
  _prev: PatientNoteActionState,
  formData: FormData
): Promise<PatientNoteActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = patientNoteSchema.safeParse({
    content: formData.get('content'),
    category: formData.get('category') || undefined,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { error: parsed.error.issues[0]?.message ?? 'Revisá los campos', fieldErrors }
  }

  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (patientError || !patient) {
    console.error('createPatientNote: paciente no encontrado en este comercio', {
      patientId,
      error: patientError,
    })
    return { error: 'No pudimos encontrar ese paciente' }
  }

  const { data: note, error } = await supabase
    .from('patient_notes')
    .insert({
      patient_id: patientId,
      content: parsed.data.content,
      category: parsed.data.category,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error || !note) {
    console.error('createPatientNote: fallo al crear la nota', { patientId, error })
    return { error: 'No pudimos crear la nota' }
  }

  if (attachments.length > 0) {
    const attachmentsToInsert = attachments.map((attachment) => ({
      note_id: note.id,
      url: attachment.url,
      file_name: attachment.file_name,
    }))

    const { error: attachmentsError } = await supabase
      .from('patient_note_attachments')
      .insert(attachmentsToInsert)

    if (attachmentsError) {
      console.error('createPatientNote: fallo al guardar adjuntos', { noteId: note.id, attachmentsError })
      await supabase.from('patient_notes').delete().eq('id', note.id)
      return { error: 'No pudimos guardar los adjuntos de la nota' }
    }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}

/**
 * Edita contenido y/o categoría de una nota existente. Mismo estilo que
 * `updatePatient`/`updateTreatmentTemplate`: `getMyShop()` + chequeo
 * explícito de ownership (join patient->shop, igual que `createPatientNote`)
 * antes del update; la policy `patient_notes_owner_update` de RLS es la
 * segunda barrera.
 */
export async function updatePatientNote(
  noteId: string,
  patientId: string,
  newAttachments: PatientNoteAttachmentInput[],
  _prev: PatientNoteActionState,
  formData: FormData
): Promise<PatientNoteActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = patientNoteSchema.safeParse({
    content: formData.get('content'),
    category: formData.get('category') || undefined,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { error: parsed.error.issues[0]?.message ?? 'Revisá los campos', fieldErrors }
  }

  const supabase = await createClient()

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (patientError || !patient) {
    console.error('updatePatientNote: paciente no encontrado en este comercio', {
      patientId,
      error: patientError,
    })
    return { error: 'No pudimos encontrar ese paciente' }
  }

  const { error } = await supabase
    .from('patient_notes')
    .update({ content: parsed.data.content, category: parsed.data.category })
    .eq('id', noteId)
    .eq('patient_id', patientId)

  if (error) {
    console.error('updatePatientNote: fallo al actualizar la nota', { noteId, patientId, error })
    return { error: 'No pudimos actualizar la nota' }
  }

  if (newAttachments.length > 0) {
    const attachmentsToInsert = newAttachments.map((attachment) => ({
      note_id: noteId,
      url: attachment.url,
      file_name: attachment.file_name,
    }))

    const { error: attachmentsError } = await supabase
      .from('patient_note_attachments')
      .insert(attachmentsToInsert)

    if (attachmentsError) {
      console.error('updatePatientNote: fallo al guardar adjuntos nuevos', { noteId, attachmentsError })
      return { error: 'La nota se actualizó, pero no pudimos guardar los adjuntos nuevos' }
    }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}

export async function deletePatientNote(
  noteId: string,
  patientId: string
): Promise<PatientNoteActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const supabase = await createClient()
  const { error } = await supabase.from('patient_notes').delete().eq('id', noteId)

  if (error) {
    console.error('deletePatientNote: fallo al borrar la nota', { noteId, error })
    return { error: 'No pudimos eliminar la nota' }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}
