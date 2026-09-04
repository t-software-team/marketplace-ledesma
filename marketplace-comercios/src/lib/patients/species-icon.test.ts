import { describe, expect, it } from 'vitest'
import { Cat, Dog, PawPrint } from 'lucide-react'
import { getSpeciesIcon } from './species-icon'

describe('getSpeciesIcon', () => {
  it('returns Dog for "perro"', () => {
    expect(getSpeciesIcon('perro')).toBe(Dog)
  })

  it('returns Cat for "gato"', () => {
    expect(getSpeciesIcon('gato')).toBe(Cat)
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(getSpeciesIcon(' Perro ')).toBe(Dog)
    expect(getSpeciesIcon('GATO')).toBe(Cat)
  })

  it('falls back to PawPrint for other species', () => {
    expect(getSpeciesIcon('otro')).toBe(PawPrint)
    expect(getSpeciesIcon('conejo')).toBe(PawPrint)
  })

  it('falls back to PawPrint for null/undefined', () => {
    expect(getSpeciesIcon(null)).toBe(PawPrint)
    expect(getSpeciesIcon(undefined)).toBe(PawPrint)
  })
})
