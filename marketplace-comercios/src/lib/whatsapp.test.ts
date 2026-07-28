import { describe, expect, it } from 'vitest'
import { toWhatsAppNumber } from './whatsapp'

describe('toWhatsAppNumber', () => {
  it('inserta el 9 faltante en números argentinos', () => {
    expect(toWhatsAppNumber('541123456789')).toBe('5491123456789')
    expect(toWhatsAppNumber('+54 11 1234-5678')).toBe('5491112345678')
  })

  it('no duplica el 9 si ya está presente', () => {
    expect(toWhatsAppNumber('5491123456789')).toBe('5491123456789')
  })

  it('agrega el código de país a números locales sin 54', () => {
    expect(toWhatsAppNumber('3886528023')).toBe('5493886528023')
    expect(toWhatsAppNumber('03886528023')).toBe('5493886528023')
  })

  it('elimina caracteres no numéricos', () => {
    expect(toWhatsAppNumber('+54 9 388 600-0000')).toBe('5493886000000')
  })
})
