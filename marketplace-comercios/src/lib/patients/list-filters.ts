import type { ShopReminderAlerts } from './alerts'

export type PatientAlertBadgeStatus = 'vencido' | 'proximo'

export interface PatientAlertBadge {
  status: PatientAlertBadgeStatus
  label: string
  variant: 'destructive' | 'warning'
}

export const PATIENT_STATUS_FILTER_VALUES = ['todos', 'vencido', 'proximo', 'al_dia'] as const
export type PatientStatusFilter = (typeof PATIENT_STATUS_FILTER_VALUES)[number]

/**
 * Deriva el badge de estado de un paciente a partir de su conteo de alertas
 * {overdue, upcoming}. "Vencido" tiene prioridad sobre "Próximo". Sin
 * alertas → sin badge (null), lo mismo que "al día". Función pura,
 * reutilizada tanto para render como para el filtro por estado.
 */
export function derivePatientAlertBadge(alerts: ShopReminderAlerts | undefined): PatientAlertBadge | null {
  if (!alerts) return null
  if (alerts.overdue > 0) {
    return { status: 'vencido', label: 'Vencido', variant: 'destructive' }
  }
  if (alerts.upcoming > 0) {
    return { status: 'proximo', label: 'Próximo', variant: 'warning' }
  }
  return null
}

interface FilterablePatient {
  id: string
  species: string | null
}

interface FilterPatientsOptions {
  statusFilter: PatientStatusFilter
  speciesFilter: string | null
}

/**
 * Filtra pacientes ya cargados (client-side, D5 del design) por estado de
 * alerta y/o especie. Se aplica DESPUÉS de la búsqueda por texto (server-side
 * vía URL) — recibe la lista ya filtrada por búsqueda.
 */
export function filterPatients<T extends FilterablePatient>(
  patients: T[],
  alertsMap: Record<string, ShopReminderAlerts>,
  { statusFilter, speciesFilter }: FilterPatientsOptions
): T[] {
  return patients.filter((patient) => {
    if (speciesFilter && patient.species !== speciesFilter) return false

    if (statusFilter === 'todos') return true

    const badge = derivePatientAlertBadge(alertsMap[patient.id])
    if (statusFilter === 'al_dia') return badge === null
    return badge?.status === statusFilter
  })
}

/**
 * Deriva la lista de especies presentes en el listado actual, ordenadas
 * alfabéticamente y sin duplicados, para poblar el filtro por especie.
 */
export function deriveSpeciesOptions(patients: FilterablePatient[]): string[] {
  const species = new Set<string>()
  for (const patient of patients) {
    if (patient.species) species.add(patient.species)
  }
  return [...species].sort((a, b) => a.localeCompare(b, 'es'))
}
