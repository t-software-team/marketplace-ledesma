import { describe, expect, it } from 'vitest'
import { profileSchema } from './profile'

describe('profileSchema', () => {
  it('acepta un nombre válido sin campos opcionales', () => {
    expect(profileSchema.safeParse({ full_name: 'Juan Pérez' }).success).toBe(true)
  })

  it('rechaza un nombre de un solo caracter', () => {
    expect(profileSchema.safeParse({ full_name: 'J' }).success).toBe(false)
  })

  it('rechaza un nombre vacío', () => {
    expect(profileSchema.safeParse({ full_name: '' }).success).toBe(false)
  })

  it('acepta teléfono y ciudad opcionales', () => {
    const result = profileSchema.safeParse({
      full_name: 'Juan Pérez',
      phone: '+5491112345678',
      city: 'Jujuy',
    })
    expect(result.success).toBe(true)
  })
})
