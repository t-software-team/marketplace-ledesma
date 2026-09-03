import { describe, expect, it } from 'vitest'
import { sanitizeOwnerSearchTerm } from './queries'

describe('sanitizeOwnerSearchTerm', () => {
  it('trims whitespace', () => {
    expect(sanitizeOwnerSearchTerm('  Juan  ')).toBe('Juan')
  })

  it('strips PostgREST .or() metacharacters', () => {
    expect(sanitizeOwnerSearchTerm('Juan,(Perez)%')).toBe('Juan  Perez')
  })

  it('strips ilike wildcards % and _', () => {
    expect(sanitizeOwnerSearchTerm('juan_perez%')).toBe('juan perez')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeOwnerSearchTerm('   ')).toBe('')
  })
})
