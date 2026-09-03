import { describe, expect, it } from 'vitest'
import { buildTreatmentShortcutUrl } from './treatment-shortcut'

describe('buildTreatmentShortcutUrl', () => {
  it('builds the ficha URL with the tratamiento=nuevo query param', () => {
    expect(buildTreatmentShortcutUrl('patient-123')).toBe(
      '/mi-tienda/pacientes/patient-123?tratamiento=nuevo'
    )
  })

  it('encodes patient ids that need escaping', () => {
    expect(buildTreatmentShortcutUrl('id with space')).toBe(
      '/mi-tienda/pacientes/id%20with%20space?tratamiento=nuevo'
    )
  })
})
