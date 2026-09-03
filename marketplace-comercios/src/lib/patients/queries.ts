import { createClient } from '@/lib/supabase/server'

export interface PatientRow {
  id: string
  shop_id: string
  name: string
  species: string | null
  breed: string | null
  sex: string | null
  birth_date: string | null
  weight: number | null
  notes: string | null
  photo_url: string | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  created_at: string
  updated_at: string
}

const PATIENT_COLUMNS =
  'id, shop_id, name, species, breed, sex, birth_date, weight, notes, photo_url, owner_name, owner_email, owner_phone, created_at, updated_at'

export interface GetShopPatientsOptions {
  search?: string
}

export async function getShopPatients(
  shopId: string,
  options: GetShopPatientsOptions = {}
): Promise<PatientRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('patients')
    .select(PATIENT_COLUMNS)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (options.search) {
    // Match por nombre del paciente o dato del dueño. Se despojan
    // metacaracteres del filtro .or() de PostgREST (comas/paréntesis) para
    // que no puedan romper la query, mismo patrón que getGymMembers.
    const q = options.search.replace(/[%,()]/g, ' ').trim()
    query = query.or(
      `name.ilike.%${q}%,owner_name.ilike.%${q}%,owner_phone.ilike.%${q}%,owner_email.ilike.%${q}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('getShopPatients: fallo al traer pacientes', { shopId, error })
    return []
  }

  return data ?? []
}

export async function getPatient(shopId: string, id: string): Promise<PatientRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_COLUMNS)
    .eq('shop_id', shopId)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getPatient: fallo al traer paciente', { shopId, id, error })
    return null
  }

  return data
}
