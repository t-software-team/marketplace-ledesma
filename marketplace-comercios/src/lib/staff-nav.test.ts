import { describe, expect, it } from 'vitest'
import { resolveStaffNavItems, resolveStaffRootHref } from './staff-nav'

describe('resolveStaffNavItems', () => {
  it('gym staff sees only Ingresos and Socios', () => {
    const items = resolveStaffNavItems('gimnasio')
    expect(items.map((i) => i.href)).toEqual(['/mi-tienda/ingresos', '/mi-tienda/socios'])
  })

  it('veterinaria staff sees only Turnos, Pacientes and Tratamientos', () => {
    const items = resolveStaffNavItems('veterinaria')
    expect(items.map((i) => i.href)).toEqual([
      '/mi-tienda/turnos',
      '/mi-tienda/pacientes',
      '/mi-tienda/tratamientos',
    ])
  })

  it('unrelated or null rubro falls back to the gym nav (default staff scope)', () => {
    expect(resolveStaffNavItems(null).map((i) => i.href)).toEqual([
      '/mi-tienda/ingresos',
      '/mi-tienda/socios',
    ])
    expect(resolveStaffNavItems('peluqueria').map((i) => i.href)).toEqual([
      '/mi-tienda/ingresos',
      '/mi-tienda/socios',
    ])
  })
})

describe('resolveStaffRootHref', () => {
  it('gym staff root is Ingresos', () => {
    expect(resolveStaffRootHref('gimnasio')).toBe('/mi-tienda/ingresos')
  })

  it('veterinaria staff root is Turnos (first item of their nav)', () => {
    expect(resolveStaffRootHref('veterinaria')).toBe('/mi-tienda/turnos')
  })
})
