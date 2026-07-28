import { describe, expect, it } from 'vitest'
import { isServiceRubro } from './category-icons'

describe('isServiceRubro', () => {
  it('clasifica peluquerías como servicio', () => {
    expect(isServiceRubro('peluquerias')).toBe(true)
  })

  it('clasifica talleres como servicio', () => {
    expect(isServiceRubro('talleres')).toBe(true)
  })

  it('clasifica farmacias como producto (no servicio)', () => {
    expect(isServiceRubro('farmacias')).toBe(false)
  })

  it('clasifica comercio como producto (no servicio)', () => {
    expect(isServiceRubro('comercio')).toBe(false)
  })

  it('devuelve false para null o undefined', () => {
    expect(isServiceRubro(null)).toBe(false)
    expect(isServiceRubro(undefined)).toBe(false)
  })
})
