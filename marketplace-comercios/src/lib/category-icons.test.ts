import { describe, expect, it } from 'vitest'
import { isServiceRubro, isVeterinariaRubro } from './category-icons'

describe('isServiceRubro', () => {
  it('clasifica peluquerías como servicio', () => {
    expect(isServiceRubro('peluquerias')).toBe(true)
  })

  it('clasifica talleres como servicio', () => {
    expect(isServiceRubro('talleres')).toBe(true)
  })

  it('clasifica gimnasio como servicio', () => {
    expect(isServiceRubro('gimnasio')).toBe(true)
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

describe('isVeterinariaRubro', () => {
  it('clasifica veterinaria como true', () => {
    expect(isVeterinariaRubro('veterinaria')).toBe(true)
  })

  it('clasifica peluquerías como false (no es genérico isServiceRubro)', () => {
    expect(isVeterinariaRubro('peluquerias')).toBe(false)
  })

  it('clasifica gimnasio como false', () => {
    expect(isVeterinariaRubro('gimnasio')).toBe(false)
  })

  it('devuelve false para null o undefined', () => {
    expect(isVeterinariaRubro(null)).toBe(false)
    expect(isVeterinariaRubro(undefined)).toBe(false)
  })
})
