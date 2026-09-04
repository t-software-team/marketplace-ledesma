import { describe, expect, it } from 'vitest'
import {
  getMonthRange,
  getWeekRange,
  groupPatientsBySpecies,
  mergeActivityFeed,
  type ActivityFeedSourceItem,
} from './dashboard-queries'

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

describe('mergeActivityFeed', () => {
  const treatment = (at: string, patientName = 'Firulais'): ActivityFeedSourceItem => ({
    kind: 'treatment',
    at,
    patientId: 'p1',
    patientName,
    label: 'Se aplicó Antiparasitario a Firulais',
  })
  const note = (at: string, patientName = 'Michi'): ActivityFeedSourceItem => ({
    kind: 'note',
    at,
    patientId: 'p2',
    patientName,
    label: 'Nueva nota en Michi',
  })

  it('devuelve solo tratamientos cuando no hay notas', () => {
    const result = mergeActivityFeed(
      [treatment('2026-03-01T10:00:00.000Z'), treatment('2026-03-02T10:00:00.000Z')],
      [],
      8
    )
    expect(result.map((item) => item.at)).toEqual([
      '2026-03-02T10:00:00.000Z',
      '2026-03-01T10:00:00.000Z',
    ])
  })

  it('devuelve solo notas cuando no hay tratamientos', () => {
    const result = mergeActivityFeed(
      [],
      [note('2026-03-01T10:00:00.000Z'), note('2026-03-02T10:00:00.000Z')],
      8
    )
    expect(result.map((item) => item.at)).toEqual([
      '2026-03-02T10:00:00.000Z',
      '2026-03-01T10:00:00.000Z',
    ])
  })

  it('mezcla tratamientos y notas ordenados por fecha desc', () => {
    const result = mergeActivityFeed(
      [treatment('2026-03-01T10:00:00.000Z'), treatment('2026-03-03T10:00:00.000Z')],
      [note('2026-03-02T10:00:00.000Z')],
      8
    )
    expect(result.map((item) => ({ kind: item.kind, at: item.at }))).toEqual([
      { kind: 'treatment', at: '2026-03-03T10:00:00.000Z' },
      { kind: 'note', at: '2026-03-02T10:00:00.000Z' },
      { kind: 'treatment', at: '2026-03-01T10:00:00.000Z' },
    ])
  })

  it('corta al límite indicado cuando hay más items que el límite', () => {
    const treatments = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'].map(
      (day) => treatment(`${day}T10:00:00.000Z`)
    )
    const notes = ['2026-03-06', '2026-03-07', '2026-03-08'].map((day) => note(`${day}T10:00:00.000Z`))
    const result = mergeActivityFeed(treatments, notes, 4)
    expect(result).toHaveLength(4)
    expect(result.map((item) => item.at)).toEqual([
      '2026-03-08T10:00:00.000Z',
      '2026-03-07T10:00:00.000Z',
      '2026-03-06T10:00:00.000Z',
      '2026-03-05T10:00:00.000Z',
    ])
  })

  it('lista vacía en ambas fuentes devuelve arreglo vacío', () => {
    expect(mergeActivityFeed([], [], 8)).toEqual([])
  })
})
