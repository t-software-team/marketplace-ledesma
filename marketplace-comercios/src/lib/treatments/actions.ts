'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getMyShop } from '@/lib/shops/queries'
import { treatmentApplicationSchema, treatmentTemplateSchema } from '@/lib/validations/treatments'
import { computeNextDueAt } from './queries'
import { getSuggestedTemplateByKey } from './suggested-templates'

export type TreatmentActionState = {
  error: string | null
  fieldErrors?: Record<string, string>
}

const TRATAMIENTOS_PATH = '/mi-tienda/tratamientos'

function buildFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

function parseRawDosesJson(raw: FormDataEntryValue | null): unknown[] {
  try {
    const parsed = JSON.parse(typeof raw === 'string' ? raw : '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseTemplateForm(formData: FormData) {
  return treatmentTemplateSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    species: formData.get('species') ?? '',
    doses: parseRawDosesJson(formData.get('doses')),
  })
}

interface DoseInput {
  label: string
  age_weeks: number | null
  interval_days_after_previous: number | null
  is_recurring: boolean
  recurrence_interval_days: number | null
}

async function insertTemplateWithDoses(
  shopId: string,
  data: {
    name: string
    type: 'vacuna' | 'desparasitacion'
    species: string | null
    doses: DoseInput[]
  }
) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('treatment_templates')
    .insert({ shop_id: shopId, name: data.name, type: data.type, species: data.species })
    .select('id')
    .single()

  if (error || !template) {
    console.error('insertTemplateWithDoses: fallo al crear plantilla', { shopId, error })
    return { error: 'No pudimos crear la plantilla' }
  }

  const dosesToInsert = data.doses.map((dose, index) => ({
    template_id: template.id,
    dose_number: index + 1,
    label: dose.label,
    age_weeks: dose.age_weeks ?? null,
    interval_days_after_previous: dose.interval_days_after_previous ?? null,
    is_recurring: dose.is_recurring ?? false,
    recurrence_interval_days: dose.recurrence_interval_days ?? null,
  }))

  const { error: dosesError } = await supabase.from('treatment_template_doses').insert(dosesToInsert)

  if (dosesError) {
    console.error('insertTemplateWithDoses: fallo al crear dosis', { templateId: template.id, dosesError })
    await supabase.from('treatment_templates').delete().eq('id', template.id)
    return { error: 'No pudimos guardar la secuencia de dosis' }
  }

  return { error: null }
}

export async function createTreatmentTemplate(
  _prev: TreatmentActionState,
  formData: FormData
): Promise<TreatmentActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = parseTemplateForm(formData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const result = await insertTemplateWithDoses(shop.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(TRATAMIENTOS_PATH)
  redirect(TRATAMIENTOS_PATH)
}

export async function createTreatmentTemplateFromSuggestion(
  suggestionKey: string
): Promise<TreatmentActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const suggestion = getSuggestedTemplateByKey(suggestionKey)
  if (!suggestion) return { error: 'Esa plantilla sugerida no existe' }

  const result = await insertTemplateWithDoses(shop.id, {
    name: suggestion.name,
    type: suggestion.type,
    species: suggestion.species,
    doses: suggestion.doses,
  })

  if (result.error) return { error: result.error }

  revalidatePath(TRATAMIENTOS_PATH)
  return { error: null }
}

export async function updateTreatmentTemplate(
  templateId: string,
  _prev: TreatmentActionState,
  formData: FormData
): Promise<TreatmentActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = parseTemplateForm(formData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('treatment_templates')
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      species: parsed.data.species,
    })
    .eq('id', templateId)
    .eq('shop_id', shop.id)

  if (error) {
    console.error('updateTreatmentTemplate: fallo al actualizar plantilla', { templateId, error })
    return { error: 'No pudimos actualizar la plantilla' }
  }

  // Reemplazamos toda la secuencia de dosis (delete + insert) en vez de
  // hacer un diff fila por fila — es más simple y la cantidad de dosis por
  // plantilla es chica (típicamente 1-4).
  const { error: deleteError } = await supabase
    .from('treatment_template_doses')
    .delete()
    .eq('template_id', templateId)

  if (deleteError) {
    console.error('updateTreatmentTemplate: fallo al borrar dosis previas', { templateId, deleteError })
    return { error: 'No pudimos actualizar la secuencia de dosis' }
  }

  const dosesToInsert = parsed.data.doses.map((dose, index) => ({
    template_id: templateId,
    dose_number: index + 1,
    label: dose.label,
    age_weeks: dose.age_weeks,
    interval_days_after_previous: dose.interval_days_after_previous,
    is_recurring: dose.is_recurring,
    recurrence_interval_days: dose.recurrence_interval_days,
  }))

  const { error: insertError } = await supabase.from('treatment_template_doses').insert(dosesToInsert)

  if (insertError) {
    console.error('updateTreatmentTemplate: fallo al insertar dosis', { templateId, insertError })
    return { error: 'No pudimos actualizar la secuencia de dosis' }
  }

  revalidatePath(TRATAMIENTOS_PATH)
  redirect(TRATAMIENTOS_PATH)
}

export async function deleteTreatmentTemplate(templateId: string): Promise<TreatmentActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('treatment_templates')
    .delete()
    .eq('id', templateId)
    .eq('shop_id', shop.id)

  if (error) {
    console.error('deleteTreatmentTemplate: fallo al borrar plantilla', { templateId, error })
    return { error: 'No pudimos eliminar la plantilla' }
  }

  revalidatePath(TRATAMIENTOS_PATH)
  return { error: null }
}

export async function applyTreatment(
  patientId: string,
  _prev: TreatmentActionState,
  formData: FormData
): Promise<TreatmentActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = treatmentApplicationSchema.safeParse({
    template_id: formData.get('template_id'),
    template_dose_id: formData.get('template_dose_id') ?? '',
    applied_at: formData.get('applied_at'),
    product_name: formData.get('product_name') ?? '',
    notes: formData.get('notes') ?? '',
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const supabase = await createClient()

  // Verificamos que el paciente sea del comercio. RLS ya impide leer/escribir
  // pacientes/plantillas ajenas; este chequeo evita un insert "silencioso" a
  // nombre de un paciente que en verdad no pertenece a este comercio.
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (patientError || !patient) {
    console.error('applyTreatment: paciente no encontrado en este comercio', {
      patientId,
      error: patientError,
    })
    return { error: 'No pudimos encontrar ese paciente' }
  }

  const { data: template, error: templateError } = await supabase
    .from('treatment_templates')
    .select('id')
    .eq('id', parsed.data.template_id)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (templateError || !template) {
    console.error('applyTreatment: plantilla no encontrada en este comercio', {
      templateId: parsed.data.template_id,
      error: templateError,
    })
    return { error: 'No pudimos encontrar esa plantilla' }
  }

  const { data: allDoses, error: dosesError } = await supabase
    .from('treatment_template_doses')
    .select('id, dose_number, interval_days_after_previous, is_recurring, recurrence_interval_days')
    .eq('template_id', parsed.data.template_id)
    .order('dose_number', { ascending: true })

  if (dosesError) {
    console.error('applyTreatment: fallo al traer dosis de la plantilla', { dosesError })
    return { error: 'No pudimos calcular la próxima dosis' }
  }

  const appliedAt = new Date(`${parsed.data.applied_at}T00:00:00Z`)
  const appliedDose = parsed.data.template_dose_id
    ? (allDoses ?? []).find((d) => d.id === parsed.data.template_dose_id)
    : null

  const nextDueAt = appliedDose ? computeNextDueAt(appliedAt, appliedDose, allDoses ?? []) : null

  const { error } = await supabase.from('treatment_applications').insert({
    patient_id: patientId,
    template_id: parsed.data.template_id,
    template_dose_id: parsed.data.template_dose_id,
    applied_at: appliedAt.toISOString(),
    next_due_at: nextDueAt,
    product_name: parsed.data.product_name,
    notes: parsed.data.notes || null,
  })

  if (error) {
    console.error('applyTreatment: fallo al registrar aplicación', { patientId, error })
    return { error: 'No pudimos registrar el tratamiento' }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}

export async function deleteTreatmentApplication(
  applicationId: string,
  patientId: string
): Promise<TreatmentActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const supabase = await createClient()
  const { error } = await supabase.from('treatment_applications').delete().eq('id', applicationId)

  if (error) {
    console.error('deleteTreatmentApplication: fallo al borrar aplicación', { applicationId, error })
    return { error: 'No pudimos eliminar el registro' }
  }

  revalidatePath(`/mi-tienda/pacientes/${patientId}`)
  return { error: null }
}
