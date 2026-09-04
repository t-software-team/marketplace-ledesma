import { describe, expect, it } from 'vitest'
import { getMonthRange, getWeekRange, groupPatientsBySpecies } from './dashboard-queries'

describe('groupPatientsBySpecies', () => {
  it('agrupa y cuenta por especie', () => {
    const patients = [
      { species: 'perro' },
      { species: 'perro' },
      { species: 'gato' },
      { species: 'perro' },
    ]
    const result = groupPatientsBySpecies(patients)
    expect(result).toEqual([
      { species: 'perro', count: 3 },
      { species: 'gato', count: 1 },
    ])
  })

  it('agrupa especie null/vacía como "otro"', () => {
    const patients = [{ species: null }, { species: '' }, { species: 'gato' }]
    const result = groupPatientsBySpecies(patients)
    expect(result).toEqual([
      { species: 'otro', count: 2 },
      { species: 'gato', count: 1 },
    ])
  })

  it('lista vacía devuelve arreglo vacío', () => {
    expect(groupPatientsBySpecies([])).toEqual([])
  })
})

describe('getWeekRange', () => {
  it('devuelve lunes a lunes siguiente (ISO UTC) para un miércoles AR', () => {
    // 2026-03-04 es miércoles. En AR (UTC-3) sigue siendo miércoles a las 09:00 local.
    const now = new Date('2026-03-04T12:00:00.000Z')
    const { start, end } = getWeekRange(now)
    // Lunes 2026-03-02 00:00 AR == 2026-03-02T03:00:00.000Z
    expect(start).toBe('2026-03-02T03:00:00.000Z')
    expect(end).toBe('2026-03-09T03:00:00.000Z')
  })

  it('domingo AR pertenece a la semana que termina ese día', () => {
    // 2026-03-08 es domingo. 10:00 UTC = 07:00 AR (mismo día).
    const now = new Date('2026-03-08T10:00:00.000Z')
    const { start, end } = getWeekRange(now)
    expect(start).toBe('2026-03-02T03:00:00.000Z')
    expect(end).toBe('2026-03-09T03:00:00.000Z')
  })
})

describe('getMonthRange', () => {
  it('devuelve primer día del mes hasta primer día del siguiente (ISO UTC, AR tz)', () => {
    const now = new Date('2026-03-15T12:00:00.000Z')
    const { start, end } = getMonthRange(now)
    expect(start).toBe('2026-03-01T03:00:00.000Z')
    expect(end).toBe('2026-04-01T03:00:00.000Z')
  })

  it('fin de mes en UTC pero todavía dentro del mes en AR', () => {
    // 2026-02-28 23:30 UTC = 2026-02-28 20:30 AR, todavía febrero.
    const now = new Date('2026-02-28T23:30:00.000Z')
    const { start, end } = getMonthRange(now)
    expect(start).toBe('2026-02-01T03:00:00.000Z')
    expect(end).toBe('2026-03-01T03:00:00.000Z')
  })
})
