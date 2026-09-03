import type { TreatmentType } from './queries'

// Plantillas sugeridas por especie. Son CONSTANTES en código (no tocan la
// DB): al elegir una, `createTreatmentTemplateFromSuggestion` inserta el
// template + sus dosis de una sola vez, con estos datos pre-armados en vez de
// leídos de un form.
export interface SuggestedDose {
  label: string
  age_weeks: number | null
  interval_days_after_previous: number | null
  is_recurring: boolean
  recurrence_interval_days: number | null
}

export interface SuggestedTemplate {
  key: string
  name: string
  type: TreatmentType
  species: 'perro' | 'gato'
  doses: SuggestedDose[]
}

export const SUGGESTED_TREATMENT_TEMPLATES: SuggestedTemplate[] = [
  {
    key: 'perro-quintuple',
    name: 'Vacuna quíntuple/séxtuple',
    type: 'vacuna',
    species: 'perro',
    doses: [
      { label: '1ra dosis', age_weeks: 6, interval_days_after_previous: null, is_recurring: false, recurrence_interval_days: null },
      { label: '2da dosis', age_weeks: null, interval_days_after_previous: 21, is_recurring: false, recurrence_interval_days: null },
      { label: '3ra dosis', age_weeks: null, interval_days_after_previous: 21, is_recurring: false, recurrence_interval_days: null },
      { label: 'Refuerzo anual', age_weeks: null, interval_days_after_previous: 344, is_recurring: true, recurrence_interval_days: 365 },
    ],
  },
  {
    key: 'perro-antirrabica',
    name: 'Antirrábica',
    type: 'vacuna',
    species: 'perro',
    doses: [
      { label: '1ra dosis', age_weeks: 12, interval_days_after_previous: null, is_recurring: false, recurrence_interval_days: null },
      { label: 'Refuerzo anual', age_weeks: null, interval_days_after_previous: 365, is_recurring: true, recurrence_interval_days: 365 },
    ],
  },
  {
    key: 'gato-antirrabica',
    name: 'Antirrábica',
    type: 'vacuna',
    species: 'gato',
    doses: [
      { label: '1ra dosis', age_weeks: 12, interval_days_after_previous: null, is_recurring: false, recurrence_interval_days: null },
      { label: 'Refuerzo anual', age_weeks: null, interval_days_after_previous: 365, is_recurring: true, recurrence_interval_days: 365 },
    ],
  },
  {
    key: 'gato-triple-felina',
    name: 'Vacuna triple felina',
    type: 'vacuna',
    species: 'gato',
    doses: [
      { label: '1ra dosis', age_weeks: 6, interval_days_after_previous: null, is_recurring: false, recurrence_interval_days: null },
      { label: '2da dosis', age_weeks: null, interval_days_after_previous: 21, is_recurring: false, recurrence_interval_days: null },
      { label: '3ra dosis', age_weeks: null, interval_days_after_previous: 21, is_recurring: false, recurrence_interval_days: null },
      { label: 'Refuerzo anual', age_weeks: null, interval_days_after_previous: 344, is_recurring: true, recurrence_interval_days: 365 },
    ],
  },
  {
    key: 'perro-desparasitacion-cachorro',
    name: 'Desparasitación cachorro',
    type: 'desparasitacion',
    species: 'perro',
    doses: [
      { label: '1ra dosis', age_weeks: 4, interval_days_after_previous: null, is_recurring: false, recurrence_interval_days: null },
      { label: '2da dosis', age_weeks: null, interval_days_after_previous: 15, is_recurring: false, recurrence_interval_days: null },
      { label: '3ra dosis', age_weeks: null, interval_days_after_previous: 21, is_recurring: false, recurrence_interval_days: null },
      { label: 'Refuerzo trimestral', age_weeks: null, interval_days_after_previous: 90, is_recurring: true, recurrence_interval_days: 90 },
    ],
  },
  {
    key: 'gato-desparasitacion-gatito',
    name: 'Desparasitación gatito',
    type: 'desparasitacion',
    species: 'gato',
    doses: [
      { label: '1ra dosis', age_weeks: 4, interval_days_after_previous: null, is_recurring: false, recurrence_interval_days: null },
      { label: '2da dosis', age_weeks: null, interval_days_after_previous: 15, is_recurring: false, recurrence_interval_days: null },
      { label: '3ra dosis', age_weeks: null, interval_days_after_previous: 21, is_recurring: false, recurrence_interval_days: null },
      { label: 'Refuerzo trimestral', age_weeks: null, interval_days_after_previous: 90, is_recurring: true, recurrence_interval_days: 90 },
    ],
  },
]

export function getSuggestedTemplatesForSpecies(species?: string | null): SuggestedTemplate[] {
  if (!species) return SUGGESTED_TREATMENT_TEMPLATES
  return SUGGESTED_TREATMENT_TEMPLATES.filter((t) => t.species === species)
}

export function getSuggestedTemplateByKey(key: string): SuggestedTemplate | undefined {
  return SUGGESTED_TREATMENT_TEMPLATES.find((t) => t.key === key)
}
