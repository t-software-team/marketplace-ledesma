import { describe, expect, it } from 'vitest'
import { filterNotes, NOTE_CATEGORY_FILTER_ALL } from './note-filters'

const notes = [
  { id: '1', category: 'consulta' as const, created_at: '2026-01-10T12:00:00.000Z' },
  { id: '2', category: 'cirugia' as const, created_at: '2026-02-15T12:00:00.000Z' },
  { id: '3', category: 'consulta' as const, created_at: '2026-03-20T12:00:00.000Z' },
]

describe('filterNotes', () => {
  it('filtra solo por categoría', () => {
    const result = filterNotes(notes, { categoryFilter: 'consulta', startDate: null, endDate: null })
    expect(result.map((n) => n.id)).toEqual(['1', '3'])
  })

  it('filtra solo por rango de fechas', () => {
    const result = filterNotes(notes, {
      categoryFilter: NOTE_CATEGORY_FILTER_ALL,
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })
    expect(result.map((n) => n.id)).toEqual(['2'])
  })

  it('combina categoría y fecha', () => {
    const result = filterNotes(notes, {
      categoryFilter: 'consulta',
      startDate: '2026-03-01',
      endDate: null,
    })
    expect(result.map((n) => n.id)).toEqual(['3'])
  })

  it('devuelve vacío cuando ningún elemento matchea', () => {
    const result = filterNotes(notes, {
      categoryFilter: 'vacunacion',
      startDate: null,
      endDate: null,
    })
    expect(result).toEqual([])
  })

  it('sin filtros devuelve todo', () => {
    const result = filterNotes(notes, {
      categoryFilter: NOTE_CATEGORY_FILTER_ALL,
      startDate: null,
      endDate: null,
    })
    expect(result).toHaveLength(3)
  })
})
