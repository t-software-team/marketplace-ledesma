import type { PatientNoteCategory } from '@/lib/validations/patients'

export const NOTE_CATEGORY_FILTER_ALL = 'todas' as const

interface FilterableNote {
  category: PatientNoteCategory
  created_at: string
}

export interface FilterNotesOptions {
  categoryFilter: PatientNoteCategory | typeof NOTE_CATEGORY_FILTER_ALL
  startDate: string | null
  endDate: string | null
}

/**
 * Filtra notas ya cargadas (client-side, mismo patrón que `filterPatients` en
 * `list-filters.ts`) por categoría y/o rango de fechas. Ambos filtros son
 * independientes y se combinan con AND. `startDate`/`endDate` son strings
 * `YYYY-MM-DD` (input date nativo); `endDate` es inclusivo.
 */
export function filterNotes<T extends FilterableNote>(
  notes: T[],
  { categoryFilter, startDate, endDate }: FilterNotesOptions
): T[] {
  return notes.filter((note) => {
    if (categoryFilter !== NOTE_CATEGORY_FILTER_ALL && note.category !== categoryFilter) {
      return false
    }

    const createdAt = new Date(note.created_at)

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`)
      if (createdAt < start) return false
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999`)
      if (createdAt > end) return false
    }

    return true
  })
}
