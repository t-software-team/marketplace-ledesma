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

/**
 * Despoja metacaracteres del filtro .or() de PostgREST (comas/paréntesis/%)
 * y recorta espacios — mismo patrón que getShopPatients, extraído como
 * función pura para poder testearla sin mockear Supabase.
 */
export function sanitizeOwnerSearchTerm(query: string): string {
  return query.replace(/[%_,()]/g, ' ').trim()
}

export interface PatientOwnerSuggestion {
  id: string
  name: string
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
}

export async function searchPatientsByOwner(
  shopId: string,
  query: string
): Promise<PatientOwnerSuggestion[]> {
  const q = sanitizeOwnerSearchTerm(query)
  if (!q) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patients')
    .select('id, name, owner_name, owner_phone, owner_email')
    .eq('shop_id', shopId)
    .or(`owner_name.ilike.%${q}%,owner_phone.ilike.%${q}%,owner_email.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('searchPatientsByOwner: fallo al buscar pacientes por dueño', { shopId, error })
    return []
  }

  return data ?? []
}

/** Cantidad de pacientes del comercio para el dashboard — count exact head, no trae filas. */
export async function getShopPatientsCount(shopId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)

  if (error) {
    console.error('getShopPatientsCount: fallo al contar pacientes', { shopId, error })
    return 0
  }

  return count ?? 0
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
