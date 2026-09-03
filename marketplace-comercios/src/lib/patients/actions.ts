'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getMyShop } from '@/lib/shops/queries'
import { patientSchema } from '@/lib/validations/patients'

export type PatientActionState = {
  error: string | null
  fieldErrors?: Record<string, string>
}

const PATIENTS_PATH = '/mi-tienda/pacientes'

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

function parsePatientForm(formData: FormData) {
  return patientSchema.safeParse({
    name: formData.get('name'),
    species: formData.get('species') ?? '',
    breed: formData.get('breed') ?? '',
    sex: formData.get('sex') ?? '',
    birth_date: formData.get('birth_date') ?? '',
    weight: formData.get('weight') ?? '',
    notes: formData.get('notes') ?? '',
    photo_url: formData.get('photo_url') ?? '',
    owner_name: formData.get('owner_name') ?? '',
    owner_email: formData.get('owner_email') ?? '',
    owner_phone: formData.get('owner_phone') ?? '',
  })
}

export async function createPatient(
  _prev: PatientActionState,
  formData: FormData
): Promise<PatientActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = parsePatientForm(formData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('patients').insert({
    shop_id: shop.id,
    name: parsed.data.name,
    species: parsed.data.species || null,
    breed: parsed.data.breed || null,
    sex: parsed.data.sex || null,
    birth_date: parsed.data.birth_date,
    weight: parsed.data.weight,
    notes: parsed.data.notes || null,
    photo_url: parsed.data.photo_url || null,
    owner_name: parsed.data.owner_name || null,
    owner_email: parsed.data.owner_email || null,
    owner_phone: parsed.data.owner_phone || null,
  })

  if (error) {
    console.error('createPatient: fallo al crear paciente', { shopId: shop.id, error })
    return { error: 'No pudimos crear el paciente' }
  }

  revalidatePath(PATIENTS_PATH)
  redirect(PATIENTS_PATH)
}

export async function updatePatient(
  patientId: string,
  _prev: PatientActionState,
  formData: FormData
): Promise<PatientActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const parsed = parsePatientForm(formData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('patients')
    .update({
      name: parsed.data.name,
      species: parsed.data.species || null,
      breed: parsed.data.breed || null,
      sex: parsed.data.sex || null,
      birth_date: parsed.data.birth_date,
      weight: parsed.data.weight,
      notes: parsed.data.notes || null,
      photo_url: parsed.data.photo_url || null,
      owner_name: parsed.data.owner_name || null,
      owner_email: parsed.data.owner_email || null,
      owner_phone: parsed.data.owner_phone || null,
    })
    .eq('id', patientId)
    .eq('shop_id', shop.id)

  if (error) {
    console.error('updatePatient: fallo al actualizar paciente', { patientId, error })
    return { error: 'No pudimos actualizar el paciente' }
  }

  revalidatePath(PATIENTS_PATH)
  redirect(PATIENTS_PATH)
}

export async function deletePatient(patientId: string): Promise<PatientActionState> {
  const shop = await getMyShop()
  if (!shop) return { error: 'No tenés un comercio creado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('shop_id', shop.id)

  if (error) {
    console.error('deletePatient: fallo al borrar paciente', { patientId, error })
    return { error: 'No pudimos eliminar el paciente' }
  }

  revalidatePath(PATIENTS_PATH)
  return { error: null }
}
