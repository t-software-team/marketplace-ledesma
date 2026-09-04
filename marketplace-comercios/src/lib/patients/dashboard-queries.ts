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

/** Semana calendario anterior a la de `getWeekRange`. Desplazar `now` 7 días
 * atrás cae siempre dentro de la semana previa porque las semanas son de
 * duración fija. */
export function getPreviousWeekRange(now: Date = new Date()): DateRange {
  return getWeekRange(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
}

/** Mes calendario anterior al de `getMonthRange`. No se puede desplazar por
 * una cantidad fija de ms (los meses no miden lo mismo), así que se recalcula
 * directo restando un mes al mes en curso. */
export function getPreviousMonthRange(now: Date = new Date()): DateRange {
  const arNow = toArgentinaFrame(now)

  const start = new Date(Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth() - 1, 1))
  const end = new Date(Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth(), 1))

  return { start: toUtcIso(start), end: toUtcIso(end) }
}

/** Valor de una métrica del período en curso junto con el mismo período
 * anterior, para poder mostrar una variación en el dashboard. */
export interface TrendValue {
  current: number
  previous: number
}

/**
 * Turnos con status='completed' cuyo starts_at cae en la semana calendario
 * en curso. Se usa starts_at (no updated_at) porque semánticamente el turno
 * "pertenece" al momento en que estaba agendado, mismo criterio que el resto
 * del dashboard (getShopUpcomingAppointments ordena/filtra por starts_at).
 */
async function countCompletedAppointments(shopId: string, range: DateRange): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('starts_at', range.start)
    .lt('starts_at', range.end)

  if (error) {
    console.error('countCompletedAppointments: fallo al contar turnos completados', {
      shopId,
      error,
    })
    return 0
  }

  return count ?? 0
}

export async function getWeeklyCompletedAppointments(shopId: string): Promise<TrendValue> {
  const [current, previous] = await Promise.all([
    countCompletedAppointments(shopId, getWeekRange()),
    countCompletedAppointments(shopId, getPreviousWeekRange()),
  ])

  return { current, previous }
}

/** Suma de `amount_charged` de turnos completados en el rango. Turnos sin
 * monto cargado no suman (no se asume un precio). */
async function sumRevenue(shopId: string, range: DateRange): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('amount_charged')
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('starts_at', range.start)
    .lt('starts_at', range.end)

  if (error) {
    console.error('sumRevenue: fallo al sumar ingresos', { shopId, error })
    return 0
  }

  return (data ?? []).reduce((sum, row) => sum + (row.amount_charged ?? 0), 0)
}

export async function getWeeklyRevenue(shopId: string): Promise<TrendValue> {
  const [current, previous] = await Promise.all([
    sumRevenue(shopId, getWeekRange()),
    sumRevenue(shopId, getPreviousWeekRange()),
  ])

  return { current, previous }
}

export interface ActivityFeedSourceItem {
  kind: 'treatment' | 'note'
  at: string
  patientId: string
  patientName: string
  label: string
}

export type ActivityFeedItem = ActivityFeedSourceItem

/**
 * Mezcla tratamientos aplicados + notas de historial clínico (ya traídos por
 * separado), ordena por fecha desc y corta a `limit`. Pura — sin acceso a
 * Supabase, testeable directamente.
 */
export function mergeActivityFeed(
  treatments: ActivityFeedSourceItem[],
  notes: ActivityFeedSourceItem[],
  limit: number
): ActivityFeedItem[] {
  return [...treatments, ...notes]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}

interface TreatmentApplicationFeedRow {
  patient_id: string
  applied_at: string
  patients: { name: string } | null
  treatment_templates: { name: string } | null
}

interface PatientNoteFeedRow {
  patient_id: string
  created_at: string
  patients: { name: string } | null
}

/**
 * Feed de actividad reciente del comercio: últimas aplicaciones de
 * tratamiento + últimas notas de historial clínico, mezcladas y ordenadas
 * por fecha. Cada fuente se trae con `limit` propio (misma cota) para no
 * perder items recientes de un tipo por exceso del otro.
 */
export async function getShopActivityFeed(shopId: string, limit = 8): Promise<ActivityFeedItem[]> {
  const supabase = await createClient()

  const [treatmentsResult, notesResult] = await Promise.all([
    supabase
      .from('treatment_applications')
      .select('patient_id, applied_at, patients!inner(shop_id, name), treatment_templates(name)')
      .eq('patients.shop_id', shopId)
      .order('applied_at', { ascending: false })
      .limit(limit),
    supabase
      .from('patient_notes')
      .select('patient_id, created_at, patients!inner(shop_id, name)')
      .eq('patients.shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  if (treatmentsResult.error) {
    console.error('getShopActivityFeed: fallo al traer tratamientos aplicados', {
      shopId,
      error: treatmentsResult.error,
    })
  }
  if (notesResult.error) {
    console.error('getShopActivityFeed: fallo al traer notas', { shopId, error: notesResult.error })
  }

  // `as unknown as`: el select con alias de join (`patients!inner(...)`,
  // `treatment_templates(...)`) no tiene un tipo generado en
  // database.types.ts — Supabase solo tipa columnas planas o relaciones
  // declaradas por FK simple, no esta forma de consulta ad-hoc.
  const treatmentItems: ActivityFeedSourceItem[] = (
    (treatmentsResult.data ?? []) as unknown as TreatmentApplicationFeedRow[]
  ).map((row) => {
    const patientName = row.patients?.name ?? 'un paciente'
    const templateName = row.treatment_templates?.name
    return {
      kind: 'treatment',
      at: row.applied_at,
      patientId: row.patient_id,
      patientName,
      label: templateName
        ? `Se aplicó ${templateName} a ${patientName}`
        : `Se aplicó un tratamiento a ${patientName}`,
    }
  })

  // Mismo motivo que arriba: join con alias sin tipo generado.
  const noteItems: ActivityFeedSourceItem[] = ((notesResult.data ?? []) as unknown as PatientNoteFeedRow[]).map(
    (row) => {
      const patientName = row.patients?.name ?? 'un paciente'
      return {
        kind: 'note',
        at: row.created_at,
        patientId: row.patient_id,
        patientName,
        label: `Nueva nota en ${patientName}`,
      }
    }
  )

  return mergeActivityFeed(treatmentItems, noteItems, limit)
}

/**
 * Tratamientos aplicados (applied_at) en el mes calendario en curso, mismo
 * patrón de join `patients!inner(shop_id)` que getShopTreatmentAlerts.
 */
async function countTreatmentApplications(shopId: string, range: DateRange): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('treatment_applications')
    .select('id, patients!inner(shop_id)', { count: 'exact', head: true })
    .eq('patients.shop_id', shopId)
    .gte('applied_at', range.start)
    .lt('applied_at', range.end)

  if (error) {
    console.error('countTreatmentApplications: fallo al contar tratamientos aplicados', {
      shopId,
      error,
    })
    return 0
  }

  return count ?? 0
}

export async function getMonthlyTreatmentCount(shopId: string): Promise<TrendValue> {
  const [current, previous] = await Promise.all([
    countTreatmentApplications(shopId, getMonthRange()),
    countTreatmentApplications(shopId, getPreviousMonthRange()),
  ])

  return { current, previous }
}

/** Pacientes nuevos (por created_at) en la semana en curso vs. la anterior. */
export async function getWeeklyNewPatients(shopId: string): Promise<TrendValue> {
  const supabase = await createClient()

  async function countInRange(range: DateRange): Promise<number> {
    const { count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .gte('created_at', range.start)
      .lt('created_at', range.end)

    if (error) {
      console.error('getWeeklyNewPatients: fallo al contar pacientes nuevos', { shopId, error })
      return 0
    }

    return count ?? 0
  }

  const [current, previous] = await Promise.all([
    countInRange(getWeekRange()),
    countInRange(getPreviousWeekRange()),
  ])

  return { current, previous }
}
