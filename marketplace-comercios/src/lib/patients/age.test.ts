import { describe, expect, it } from 'vitest'
import { calculateAge } from './age'

describe('calculateAge', () => {
  it('returns null for missing birth date', () => {
    expect(calculateAge(null)).toBeNull()
  })

  it('returns "menos de 1 mes" for a newborn (a few days old)', () => {
    const birthDate = new Date()
    birthDate.setDate(birthDate.getDate() - 10)
    expect(calculateAge(birthDate.toISOString())).toBe('menos de 1 mes')
  })

  it('returns weeks text for babies under a month (edge case reasoning kept in months granularity)', () => {
    const birthDate = new Date()
    birthDate.setDate(birthDate.getDate() - 20)
    expect(calculateAge(birthDate.toISOString())).toBe('menos de 1 mes')
  })

  it('returns months-only text when under a year', () => {
    const birthDate = new Date()
    birthDate.setMonth(birthDate.getMonth() - 8)
    expect(calculateAge(birthDate.toISOString())).toBe('8 meses')
  })

  it('returns singular month text for exactly 1 month', () => {
    const birthDate = new Date()
    birthDate.setMonth(birthDate.getMonth() - 1)
    expect(calculateAge(birthDate.toISOString())).toBe('1 mes')
  })

  it('returns years+months text when over a year with remainder months', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 2)
    birthDate.setMonth(birthDate.getMonth() - 3)
    expect(calculateAge(birthDate.toISOString())).toBe('2 años, 3 meses')
  })

  it('returns years-only text for exactly N years', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 3)
    expect(calculateAge(birthDate.toISOString())).toBe('3 años')
  })

  it('returns singular year text for exactly 1 year', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 1)
    expect(calculateAge(birthDate.toISOString())).toBe('1 año')
  })
})
