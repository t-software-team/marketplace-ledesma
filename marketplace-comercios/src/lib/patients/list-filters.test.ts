import { describe, expect, it } from 'vitest'
import { derivePatientAlertBadge, deriveSpeciesOptions, filterPatients } from './list-filters'

describe('derivePatientAlertBadge', () => {
  it('returns a destructive "Vencido" badge when overdue > 0', () => {
    expect(derivePatientAlertBadge({ overdue: 1, upcoming: 0 })).toEqual({
      status: 'vencido',
      label: 'Vencido',
      variant: 'destructive',
    })
  })

  it('returns a warning "Próximo" badge when only upcoming > 0', () => {
    expect(derivePatientAlertBadge({ overdue: 0, upcoming: 2 })).toEqual({
      status: 'proximo',
      label: 'Próximo',
      variant: 'warning',
    })
  })

  it('prioritizes vencido over proximo when both are present', () => {
    expect(derivePatientAlertBadge({ overdue: 1, upcoming: 1 })?.status).toBe('vencido')
  })

  it('returns null when there are no alerts (up to date)', () => {
    expect(derivePatientAlertBadge({ overdue: 0, upcoming: 0 })).toBeNull()
  })

  it('returns null when the patient has no entry in the alerts map', () => {
    expect(derivePatientAlertBadge(undefined)).toBeNull()
  })
})

describe('deriveSpeciesOptions', () => {
  it('derives a sorted list of unique species from the loaded patients', () => {
    expect(
      deriveSpeciesOptions([
        { id: '1', species: 'Perro' },
        { id: '2', species: 'Gato' },
        { id: '3', species: 'Perro' },
        { id: '4', species: null },
      ])
    ).toEqual(['Gato', 'Perro'])
  })

  it('returns an empty array when no patient has a species', () => {
    expect(deriveSpeciesOptions([{ id: '1', species: null }])).toEqual([])
  })
})

describe('filterPatients', () => {
  const patients = [
    { id: 'p1', species: 'Perro' },
    { id: 'p2', species: 'Gato' },
    { id: 'p3', species: 'Perro' },
  ]
  const alertsMap = {
    p1: { overdue: 1, upcoming: 0 },
    p2: { overdue: 0, upcoming: 1 },
  }

  it('returns all patients when status filter is "todos" and no species filter', () => {
    expect(filterPatients(patients, alertsMap, { statusFilter: 'todos', speciesFilter: null })).toHaveLength(3)
  })

  it('filters by "vencido" status', () => {
    const result = filterPatients(patients, alertsMap, { statusFilter: 'vencido', speciesFilter: null })
    expect(result.map((p) => p.id)).toEqual(['p1'])
  })

  it('filters by "proximo" status', () => {
    const result = filterPatients(patients, alertsMap, { statusFilter: 'proximo', speciesFilter: null })
    expect(result.map((p) => p.id)).toEqual(['p2'])
  })

  it('filters by "al_dia" status (no badge, including patients absent from the map)', () => {
    const result = filterPatients(patients, alertsMap, { statusFilter: 'al_dia', speciesFilter: null })
    expect(result.map((p) => p.id)).toEqual(['p3'])
  })

  it('filters by species', () => {
    const result = filterPatients(patients, alertsMap, { statusFilter: 'todos', speciesFilter: 'Perro' })
    expect(result.map((p) => p.id)).toEqual(['p1', 'p3'])
  })

  it('combines status and species filters', () => {
    const result = filterPatients(patients, alertsMap, { statusFilter: 'vencido', speciesFilter: 'Perro' })
    expect(result.map((p) => p.id)).toEqual(['p1'])
  })
})
