import { createClient } from '@/lib/supabase/server'

export interface SpeciesBreakdownItem {
  species: string
  count: number
}

/**
 * Agrupa pacientes ya cargados (vía getShopPatients) por especie y cuenta
 * cuántos hay de cada una. Pura — no hace query nueva, el dato ya está
 * disponible en memoria. Especie null/vacía cae en "otro". Ordenado por
 * cantidad descendente.
 */
export function groupPatientsBySpecies(
  patients: { species: string | null }[]
): SpeciesBreakdownItem[] {
  const counts = new Map<string, number>()

  for (const patient of patients) {
    const key = patient.species?.trim() || 'otro'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count)
}

// Argentina no usa horario de verano desde 2009: offset fijo UTC-3. Se
// desplaza `now` a "hora local AR" usando getters UTC, se calculan los
// límites en ese marco, y se vuelve a desplazar a UTC real para las queries.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000

function toArgentinaFrame(date: Date): Date {
  return new Date(date.getTime() - AR_OFFSET_MS)
}

function toUtcIso(date: Date): string {
  return new Date(date.getTime() + AR_OFFSET_MS).toISOString()
}

export interface DateRange {
  start: string
  end: string
}

/** Semana calendario en curso (lunes a lunes siguiente), timezone America/Argentina/Buenos_Aires. */
export function getWeekRange(now: Date = new Date()): DateRange {
  const arNow = toArgentinaFrame(now)
  const day = arNow.getUTCDay() // 0=domingo..6=sábado
  const diffToMonday = day === 0 ? 6 : day - 1

  const start = new Date(
    Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth(), arNow.getUTCDate() - diffToMonday)
  )
  const end = new Date(
    Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth(), arNow.getUTCDate() - diffToMonday + 7)
  )

  return { start: toUtcIso(start), end: toUtcIso(end) }
}

/** Mes calendario en curso (día 1 al día 1 del siguiente), timezone America/Argentina/Buenos_Aires. */
export function getMonthRange(now: Date = new Date()): DateRange {
  const arNow = toArgentinaFrame(now)

  const start = new Date(Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth(), 1))
  const end = new Date(Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth() + 1, 1))

  return { start: toUtcIso(start), end: toUtcIso(end) }
}

/**
 * Turnos con status='completed' cuyo starts_at cae en la semana calendario
 * en curso. Se usa starts_at (no updated_at) porque semánticamente el turno
 * "pertenece" al momento en que estaba agendado, mismo criterio que el resto
 * del dashboard (getShopUpcomingAppointments ordena/filtra por starts_at).
 */
export async function getWeeklyCompletedAppointments(shopId: string): Promise<number> {
  const supabase = await createClient()
  const { start, end } = getWeekRange()

  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('starts_at', start)
    .lt('starts_at', end)

  if (error) {
    console.error('getWeeklyCompletedAppointments: fallo al contar turnos completados', {
      shopId,
      error,
    })
    return 0
  }

  return count ?? 0
}

/**
 * Tratamientos aplicados (applied_at) en el mes calendario en curso, mismo
 * patrón de join `patients!inner(shop_id)` que getShopTreatmentAlerts.
 */
export async function getMonthlyTreatmentCount(shopId: string): Promise<number> {
  const supabase = await createClient()
  const { start, end } = getMonthRange()

  const { count, error } = await supabase
    .from('treatment_applications')
    .select('id, patients!inner(shop_id)', { count: 'exact', head: true })
    .eq('patients.shop_id', shopId)
    .gte('applied_at', start)
    .lt('applied_at', end)

  if (error) {
    console.error('getMonthlyTreatmentCount: fallo al contar tratamientos aplicados', {
      shopId,
      error,
    })
    return 0
  }

  return count ?? 0
}
