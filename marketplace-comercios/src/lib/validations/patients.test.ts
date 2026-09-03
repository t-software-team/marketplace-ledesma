import { describe, expect, it } from 'vitest'
import { patientNoteSchema, patientSchema } from './patients'

describe('patientSchema', () => {
  const base = { name: 'Firulais' }

  it('acepta el mínimo requerido (solo nombre)', () => {
    expect(patientSchema.safeParse(base).success).toBe(true)
  })

  it('rechaza un nombre vacío', () => {
    expect(patientSchema.safeParse({ ...base, name: '' }).success).toBe(false)
  })

  it('acepta datos completos', () => {
    const result = patientSchema.safeParse({
      ...base,
      species: 'Perro',
      breed: 'Labrador',
      sex: 'macho',
      birth_date: '2022-01-15',
      weight: '18.5',
      photo_url: 'https://example.com/foto.jpg',
      owner_name: 'Juan Pérez',
      owner_email: 'juan@example.com',
      owner_phone: '+5491112345678',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza un peso no numérico', () => {
    expect(patientSchema.safeParse({ ...base, weight: 'mucho' }).success).toBe(false)
  })

  it('acepta peso vacío', () => {
    const result = patientSchema.safeParse({ ...base, weight: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.weight).toBeNull()
    }
  })

  it('rechaza un owner_email inválido', () => {
    expect(patientSchema.safeParse({ ...base, owner_email: 'no-es-un-email' }).success).toBe(false)
  })

  it('acepta owner_email vacío', () => {
    expect(patientSchema.safeParse({ ...base, owner_email: '' }).success).toBe(true)
  })

  it('rechaza una birth_date con formato inválido', () => {
    expect(patientSchema.safeParse({ ...base, birth_date: '15/01/2022' }).success).toBe(false)
  })

  it('acepta birth_date vacío', () => {
    const result = patientSchema.safeParse({ ...base, birth_date: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.birth_date).toBeNull()
    }
  })
})

describe('patientNoteSchema', () => {
  it('acepta una categoría válida', () => {
    const result = patientNoteSchema.safeParse({ content: 'Control anual', category: 'consulta' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('consulta')
    }
  })

  it('rechaza una categoría inválida', () => {
    expect(patientNoteSchema.safeParse({ content: 'Control anual', category: 'no-existe' }).success).toBe(
      false
    )
  })

  it('la categoría omitida cae por defecto en "otro"', () => {
    const result = patientNoteSchema.safeParse({ content: 'Control anual' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('otro')
    }
  })

  it('rechaza contenido vacío', () => {
    expect(patientNoteSchema.safeParse({ content: '', category: 'otro' }).success).toBe(false)
  })
})
