import { describe, expect, it } from 'vitest'
import { computeNextDueAt, deriveTreatmentStatus } from './queries'

describe('deriveTreatmentStatus', () => {
  it('devuelve al_dia cuando next_due_at es null (sin recordatorio)', () => {
    expect(deriveTreatmentStatus(null)).toBe('al_dia')
  })

  it('devuelve al_dia cuando next_due_at está muy lejos en el futuro', () => {
    const farFuture = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    expect(deriveTreatmentStatus(farFuture)).toBe('al_dia')
  })

  it('devuelve proximo cuando next_due_at cae dentro de la ventana de N días', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(deriveTreatmentStatus(soon, 14)).toBe('proximo')
  })

  it('devuelve proximo justo en el borde de la ventana', () => {
    const edge = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    expect(deriveTreatmentStatus(edge, 14)).toBe('proximo')
  })

  it('devuelve vencido cuando next_due_at ya pasó', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(deriveTreatmentStatus(past)).toBe('vencido')
  })

  it('respeta un threshold custom', () => {
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(deriveTreatmentStatus(inThreeDays, 1)).toBe('al_dia')
    expect(deriveTreatmentStatus(inThreeDays, 5)).toBe('proximo')
  })
})

describe('computeNextDueAt', () => {
  const appliedAt = new Date('2026-01-01T00:00:00Z')

  it('caso 1: dosis recurrente -> applied_at + recurrence_interval_days', () => {
    const dose = { dose_number: 4, is_recurring: true, recurrence_interval_days: 365 }
    const result = computeNextDueAt(appliedAt, dose, [])
    expect(result).toBe(new Date('2027-01-01T00:00:00Z').toISOString())
  })

  it('caso 2: no recurrente pero hay una dosis siguiente en la secuencia', () => {
    const dose = { dose_number: 1, is_recurring: false, recurrence_interval_days: null }
    const allDoses = [
      { dose_number: 1, interval_days_after_previous: null },
      { dose_number: 2, interval_days_after_previous: 21 },
    ]
    const result = computeNextDueAt(appliedAt, dose, allDoses)
    expect(result).toBe(new Date('2026-01-22T00:00:00Z').toISOString())
  })

  it('caso 3: no recurrente y no hay dosis siguiente -> null (serie completa)', () => {
    const dose = { dose_number: 2, is_recurring: false, recurrence_interval_days: null }
    const allDoses = [
      { dose_number: 1, interval_days_after_previous: null },
      { dose_number: 2, interval_days_after_previous: 21 },
    ]
    const result = computeNextDueAt(appliedAt, dose, allDoses)
    expect(result).toBeNull()
  })

  it('dosis recurrente sin recurrence_interval_days -> null (dato inconsistente)', () => {
    const dose = { dose_number: 1, is_recurring: true, recurrence_interval_days: null }
    expect(computeNextDueAt(appliedAt, dose, [])).toBeNull()
  })
})
