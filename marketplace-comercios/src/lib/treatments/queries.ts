import { createClient } from '@/lib/supabase/server'

export type TreatmentType = 'vacuna' | 'desparasitacion'

export interface TreatmentTemplateRow {
  id: string
  shop_id: string
  name: string
  type: TreatmentType
  species: string | null
  created_at: string
  updated_at: string
}

export interface TreatmentTemplateDoseRow {
  id: string
  template_id: string
  dose_number: number
  label: string
  age_weeks: number | null
  interval_days_after_previous: number | null
  is_recurring: boolean
  recurrence_interval_days: number | null
  created_at: string
  updated_at: string
}

export interface TreatmentTemplateWithDoses extends TreatmentTemplateRow {
  doses: TreatmentTemplateDoseRow[]
}

export interface TreatmentApplicationRow {
  id: string
  patient_id: string
  template_id: string | null
  template_dose_id: string | null
  applied_at: string
  next_due_at: string | null
  product_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TreatmentStatus = 'al_dia' | 'proximo' | 'vencido'

export interface TreatmentApplicationWithStatus extends TreatmentApplicationRow {
  status: TreatmentStatus
  template: Pick<TreatmentTemplateRow, 'id' | 'name' | 'type'> | null
  dose: Pick<TreatmentTemplateDoseRow, 'id' | 'dose_number' | 'label'> | null
}

const TEMPLATE_COLUMNS = 'id, shop_id, name, type, species, created_at, updated_at'

const DOSE_COLUMNS =
  'id, template_id, dose_number, label, age_weeks, interval_days_after_previous, is_recurring, recurrence_interval_days, created_at, updated_at'

const APPLICATION_COLUMNS =
  'id, patient_id, template_id, template_dose_id, applied_at, next_due_at, product_name, notes, created_at, updated_at, treatment_templates ( id, name, type ), treatment_template_doses ( id, dose_number, label )'

// Status derivado en TS a partir de next_due_at, NUNCA persistido (no-goal
// explícito): un application sin next_due_at (serie completa, sin más dosis)
// está siempre "al_dia" — no hay nada que vencer. Si next_due_at ya pasó,
// "vencido". Si cae dentro de la ventana de aviso (thresholdDays, default
// 14), "proximo". Caso contrario, "al_dia".
export function deriveTreatmentStatus(
  nextDueAt: string | null,
  thresholdDays = 14
): TreatmentStatus {
  if (!nextDueAt) return 'al_dia'

  const now = Date.now()
  const dueTime = new Date(nextDueAt).getTime()
  const diffDays = (dueTime - now) / (24 * 60 * 60 * 1000)

  if (diffDays < 0) return 'vencido'
  if (diffDays <= thresholdDays) return 'proximo'
  return 'al_dia'
}

// Calcula next_due_at dado la dosis que se acaba de aplicar y el resto de la
// secuencia de dosis de la plantilla:
// 1. Si la dosis aplicada es recurrente, next_due_at = applied_at +
//    recurrence_interval_days.
// 2. Si no, buscamos la dosis con dose_number = aplicada.dose_number + 1: si
//    existe, next_due_at = applied_at + esa_dosis_siguiente.interval_days_after_previous.
// 3. Si no hay dosis siguiente y no es recurrente, next_due_at = null (serie
//    completa, no hay más recordatorios).
export function computeNextDueAt(
  appliedAt: Date,
  appliedDose: Pick<TreatmentTemplateDoseRow, 'dose_number' | 'is_recurring' | 'recurrence_interval_days'>,
  allDoses: Pick<TreatmentTemplateDoseRow, 'dose_number' | 'interval_days_after_previous'>[]
): string | null {
  if (appliedDose.is_recurring) {
    if (!appliedDose.recurrence_interval_days) return null
    const due = new Date(appliedAt)
    due.setUTCDate(due.getUTCDate() + appliedDose.recurrence_interval_days)
    return due.toISOString()
  }

  const nextDose = allDoses.find((d) => d.dose_number === appliedDose.dose_number + 1)
  if (!nextDose || !nextDose.interval_days_after_previous) return null

  const due = new Date(appliedAt)
  due.setUTCDate(due.getUTCDate() + nextDose.interval_days_after_previous)
  return due.toISOString()
}

export async function getTreatmentTemplates(shopId: string): Promise<TreatmentTemplateRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_templates')
    .select(TEMPLATE_COLUMNS)
    .eq('shop_id', shopId)
    .order('name', { ascending: true })

  if (error) {
    console.error('getTreatmentTemplates: fallo al traer plantillas', { shopId, error })
    return []
  }

  return data ?? []
}

export async function getTreatmentTemplatesWithDoses(
  shopId: string
): Promise<TreatmentTemplateWithDoses[]> {
  const templates = await getTreatmentTemplates(shopId)
  if (templates.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('treatment_template_doses')
    .select(DOSE_COLUMNS)
    .in('template_id', templates.map((t) => t.id))
    .order('dose_number', { ascending: true })

  if (error) {
    console.error('getTreatmentTemplatesWithDoses: fallo al traer dosis', { shopId, error })
  }

  const dosesByTemplate = new Map<string, TreatmentTemplateDoseRow[]>()
  for (const dose of data ?? []) {
    const list = dosesByTemplate.get(dose.template_id) ?? []
    list.push(dose)
    dosesByTemplate.set(dose.template_id, list)
  }

  return templates.map((template) => ({
    ...template,
    doses: dosesByTemplate.get(template.id) ?? [],
  }))
}

export async function getTreatmentTemplate(
  shopId: string,
  id: string
): Promise<TreatmentTemplateWithDoses | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_templates')
    .select(TEMPLATE_COLUMNS)
    .eq('shop_id', shopId)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('getTreatmentTemplate: fallo al traer plantilla', { shopId, id, error })
    return null
  }

  const doses = await getTreatmentTemplateDoses(id)
  return { ...data, doses }
}

export async function getTreatmentTemplateDoses(templateId: string): Promise<TreatmentTemplateDoseRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_template_doses')
    .select(DOSE_COLUMNS)
    .eq('template_id', templateId)
    .order('dose_number', { ascending: true })

  if (error) {
    console.error('getTreatmentTemplateDoses: fallo al traer dosis', { templateId, error })
    return []
  }

  return data ?? []
}

export async function getPatientTreatments(
  patientId: string
): Promise<TreatmentApplicationWithStatus[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_applications')
    .select(APPLICATION_COLUMNS)
    .eq('patient_id', patientId)
    .order('applied_at', { ascending: false })

  if (error) {
    console.error('getPatientTreatments: fallo al traer tratamientos', { patientId, error })
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    patient_id: row.patient_id,
    template_id: row.template_id,
    template_dose_id: row.template_dose_id,
    applied_at: row.applied_at,
    next_due_at: row.next_due_at,
    product_name: row.product_name,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: deriveTreatmentStatus(row.next_due_at),
    template: row.treatment_templates ?? null,
    dose: row.treatment_template_doses ?? null,
  }))
}
