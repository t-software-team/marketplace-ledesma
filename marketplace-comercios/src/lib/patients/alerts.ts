import { createClient } from '@/lib/supabase/server'
import {
  countTreatmentAlerts,
  deriveTreatmentStatus,
  getShopTreatmentAlerts,
  type ShopTreatmentAlerts,
} from '@/lib/treatments/queries'
import { listShopReminderDueDates, listShopReminderDueDatesByPatient } from './reminders-queries'

export type ShopReminderAlerts = ShopTreatmentAlerts

/**
 * Combina alertas de treatment_applications + patient_reminders en una sola
 * cuenta {overdue, upcoming}, reusando countTreatmentAlerts/deriveTreatmentStatus
 * (misma lógica que el badge de estado, no se duplica). Extraído como función
 * pura para poder testearla sin mockear Supabase (D2 del design).
 */
export function combineReminderAlerts(
  treatmentAlerts: ShopTreatmentAlerts,
  reminderDueAts: (string | null)[]
): ShopReminderAlerts {
  const reminderCounts = countTreatmentAlerts(reminderDueAts)
  return {
    overdue: treatmentAlerts.overdue + reminderCounts.overdue,
    upcoming: treatmentAlerts.upcoming + reminderCounts.upcoming,
  }
}

/**
 * Alertas agregadas del comercio (dashboard). ÚNICA fuente de verdad
 * consumida por VetResumen (PR1 swap) y, más adelante, por la ficha del
 * paciente (D2 — evita que las tres superficies diverjan).
 */
export async function getShopReminderAlerts(shopId: string): Promise<ShopReminderAlerts> {
  const [treatmentAlerts, reminderDueAts] = await Promise.all([
    getShopTreatmentAlerts(shopId),
    listShopReminderDueDates(shopId),
  ])

  return combineReminderAlerts(treatmentAlerts, reminderDueAts)
}

interface PatientDueDate {
  patient_id: string
  due_at: string | null
}

/**
 * Combina due dates de tratamientos + recordatorios agrupados por paciente
 * en un mapa {patientId: {overdue, upcoming}}. Función pura, testeable sin
 * mockear Supabase.
 */
export function combinePatientAlertsMap(
  treatmentDueDates: PatientDueDate[],
  reminderDueDates: PatientDueDate[]
): Record<string, ShopReminderAlerts> {
  const map: Record<string, ShopReminderAlerts> = {}

  for (const { patient_id, due_at } of [...treatmentDueDates, ...reminderDueDates]) {
    if (!due_at) continue
    const status = deriveTreatmentStatus(due_at)
    if (status === 'al_dia') continue

    const current = map[patient_id] ?? { overdue: 0, upcoming: 0 }
    if (status === 'vencido') current.overdue++
    else current.upcoming++
    map[patient_id] = current
  }

  return map
}

async function getShopTreatmentDueDatesByPatient(shopId: string): Promise<PatientDueDate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_applications')
    .select('patient_id, next_due_at, patients!inner(shop_id)')
    .eq('patients.shop_id', shopId)
    .not('next_due_at', 'is', null)

  if (error) {
    console.error('getShopTreatmentDueDatesByPatient: fallo al traer tratamientos', { shopId, error })
    return []
  }

  return (data ?? []).map((row) => ({ patient_id: row.patient_id, due_at: row.next_due_at }))
}

/**
 * Mapa por paciente de alertas combinadas, consumido por el badge de estado
 * del listado de pacientes (PR6). Definida en PR5a per design pero todavía
 * no consumida en UI — no-goal explícito de este slice.
 */
export async function getShopPatientAlertsMap(
  shopId: string
): Promise<Record<string, ShopReminderAlerts>> {
  const [treatmentDueDates, reminderDueDates] = await Promise.all([
    getShopTreatmentDueDatesByPatient(shopId),
    listShopReminderDueDatesByPatient(shopId),
  ])

  return combinePatientAlertsMap(treatmentDueDates, reminderDueDates)
}
