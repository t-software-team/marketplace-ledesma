import { describe, expect, it } from 'vitest'
import {
  treatmentApplicationSchema,
  treatmentDoseSequenceSchema,
  treatmentTemplateSchema,
} from './treatments'

const singleDose = { label: '1ra dosis', age_weeks: '6' }
const recurringLast = {
  label: 'Refuerzo anual',
  interval_days_after_previous: '344',
  is_recurring: true,
  recurrence_interval_days: '365',
}

describe('treatmentDoseSequenceSchema', () => {
  it('acepta una sola dosis no recurrente', () => {
    expect(treatmentDoseSequenceSchema.safeParse([singleDose]).success).toBe(true)
  })

  it('acepta una secuencia con refuerzo recurrente en la última dosis', () => {
    const result = treatmentDoseSequenceSchema.safeParse([
      singleDose,
      { label: '2da dosis', interval_days_after_previous: '21' },
      recurringLast,
    ])
    expect(result.success).toBe(true)
  })

  it('rechaza una secuencia vacía', () => {
    expect(treatmentDoseSequenceSchema.safeParse([]).success).toBe(false)
  })

  it('rechaza is_recurring=true en una dosis que no es la última', () => {
    const result = treatmentDoseSequenceSchema.safeParse([
      { ...singleDose, is_recurring: true, recurrence_interval_days: '365' },
      { label: '2da dosis', interval_days_after_previous: '21' },
    ])
    expect(result.success).toBe(false)
  })

  it('rechaza is_recurring=true sin recurrence_interval_days', () => {
    const result = treatmentDoseSequenceSchema.safeParse([{ label: 'Refuerzo', is_recurring: true }])
    expect(result.success).toBe(false)
  })

  it('rechaza una dosis posterior a la primera sin interval_days_after_previous', () => {
    const result = treatmentDoseSequenceSchema.safeParse([singleDose, { label: '2da dosis' }])
    expect(result.success).toBe(false)
  })
})

describe('treatmentTemplateSchema', () => {
  const base = { name: 'Quíntuple', type: 'vacuna' as const, doses: [singleDose] }

  it('acepta el mínimo requerido (nombre + tipo + al menos una dosis)', () => {
    expect(treatmentTemplateSchema.safeParse(base).success).toBe(true)
  })

  it('rechaza un nombre vacío', () => {
    expect(treatmentTemplateSchema.safeParse({ ...base, name: '' }).success).toBe(false)
  })

  it('rechaza un tipo inválido', () => {
    expect(treatmentTemplateSchema.safeParse({ ...base, type: 'otro' }).success).toBe(false)
  })

  it('rechaza una especie inválida', () => {
    expect(treatmentTemplateSchema.safeParse({ ...base, species: 'loro' }).success).toBe(false)
  })

  it('acepta especie perro/gato/otro', () => {
    expect(treatmentTemplateSchema.safeParse({ ...base, species: 'perro' }).success).toBe(true)
  })

  it('rechaza una plantilla sin dosis', () => {
    expect(treatmentTemplateSchema.safeParse({ ...base, doses: [] }).success).toBe(false)
  })
})

describe('treatmentApplicationSchema', () => {
  it('acepta template_id + applied_at válidos', () => {
    const result = treatmentApplicationSchema.safeParse({
      template_id: '11111111-1111-1111-1111-111111111111',
      applied_at: '2026-09-03',
      notes: '',
    })
    expect(result.success).toBe(true)
  })

  it('acepta template_dose_id y product_name opcionales', () => {
    const result = treatmentApplicationSchema.safeParse({
      template_id: '11111111-1111-1111-1111-111111111111',
      template_dose_id: '22222222-2222-2222-2222-222222222222',
      applied_at: '2026-09-03',
      product_name: 'Nobivac Rabia lote 123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.product_name).toBe('Nobivac Rabia lote 123')
      expect(result.data.template_dose_id).toBe('22222222-2222-2222-2222-222222222222')
    }
  })

  it('rechaza applied_at con formato inválido', () => {
    const result = treatmentApplicationSchema.safeParse({
      template_id: '11111111-1111-1111-1111-111111111111',
      applied_at: '03/09/2026',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza template_id vacío', () => {
    const result = treatmentApplicationSchema.safeParse({ template_id: '', applied_at: '2026-09-03' })
    expect(result.success).toBe(false)
  })
})
