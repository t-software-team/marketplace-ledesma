import { describe, expect, it } from 'vitest'
import { formatPrice } from './format'

describe('formatPrice', () => {
  it('devuelve "Consultar" cuando el precio es null', () => {
    expect(formatPrice(null)).toBe('Consultar')
  })

  it('formatea un precio en ARS por defecto', () => {
    const result = formatPrice(1500)
    expect(result).toContain('1.500')
  })

  it('no muestra decimales', () => {
    expect(formatPrice(1500.99)).not.toContain(',99')
  })
})
