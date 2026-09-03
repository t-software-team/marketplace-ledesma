import { createClient } from '@/lib/supabase/server'

export interface PatientReminderRow {
  id: string
  patient_id: string
  label: string
  due_at: string
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

const REMINDER_COLUMNS = 'id, patient_id, label, due_at, reminder_sent_at, created_at, updated_at'

export async function listPatientReminders(patientId: string): Promise<PatientReminderRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patient_reminders')
    .select(REMINDER_COLUMNS)
    .eq('patient_id', patientId)
    .order('due_at', { ascending: true })

  if (error) {
    console.error('listPatientReminders: fallo al traer recordatorios', { patientId, error })
    return []
  }

  return data ?? []
}

/**
 * Todos los `due_at` de recordatorios pendientes (`reminder_sent_at` null no
 * es requisito acá: el estado al_dia/proximo/vencido de un recordatorio
 * enviado sigue siendo relevante hasta que se borre o se actualice) de un
 * comercio, para el helper unificado de alertas (`alerts.ts`).
 */
export async function listShopReminderDueDates(shopId: string): Promise<(string | null)[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patient_reminders')
    .select('due_at, patients!inner(shop_id)')
    .eq('patients.shop_id', shopId)

  if (error) {
    console.error('listShopReminderDueDates: fallo al traer recordatorios', { shopId, error })
    return []
  }

  return (data ?? []).map((row) => row.due_at)
}

/**
 * `due_at` de recordatorios agrupados por paciente, para el mapa por
 * paciente (`getShopPatientAlertsMap`, PR6).
 */
export async function listShopReminderDueDatesByPatient(
  shopId: string
): Promise<{ patient_id: string; due_at: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patient_reminders')
    .select('patient_id, due_at, patients!inner(shop_id)')
    .eq('patients.shop_id', shopId)

  if (error) {
    console.error('listShopReminderDueDatesByPatient: fallo al traer recordatorios', { shopId, error })
    return []
  }

  return (data ?? []).map((row) => ({ patient_id: row.patient_id, due_at: row.due_at }))
}
