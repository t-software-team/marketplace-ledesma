'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getMyShop } from '@/lib/shops/queries'
import { patientReminderSchema } from '@/lib/validations/patients'

export type PatientReminderActionState = {
  error: string | null
  fieldErrors?: Record<string, string>
}

/**
 * CRUD mínimo de `patient_reminders` (create/list/delete), mismo estilo que
 * `patients/actions.ts` y `treatments/actions.ts`: `getMyShop()` + un chequeo
 * explícito de que el paciente pertenece al comercio antes de escribir (RLS
 * ya lo impide a nivel de base, esto evita un insert "silencioso" contra un
 * `patient_id` ajeno). La UI que consume estas acciones es PR5b — acá solo
 * queda el helper listo, sin renderizarse todavía.
 */
export async function createPatientReminder(
  patientId: string,
  _prev: PatientReminderActionState,
  formData: FormData
): Promise<PatientReminderActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = patientReminderSchema.safeParse({
    label: formData.get('label'),
    due_at: formData.get('due_at'),
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
    console.error('createPatientReminder: paciente no encontrado en este comercio', {
      patientId,
      error: patientError,
    })
    return { error: 'No pudimos encontrar ese paciente' }
  }

  const { error } = await supabase.from('patient_reminders').insert({
    patient_id: patientId,
    label: parsed.data.label,
    due_at: new Date(`${parsed.data.due_at}T00:00:00Z`).toISOString(),
  })

  if (error) {
    console.error('createPatientReminder: fallo al crear recordatorio', { patientId, error })
    return { error: 'No pudimos crear el recordatorio' }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}

export async function deletePatientReminder(
  reminderId: string,
  patientId: string
): Promise<PatientReminderActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const supabase = await createClient()
  const { error } = await supabase.from('patient_reminders').delete().eq('id', reminderId)

  if (error) {
    console.error('deletePatientReminder: fallo al borrar recordatorio', { reminderId, error })
    return { error: 'No pudimos eliminar el recordatorio' }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}
