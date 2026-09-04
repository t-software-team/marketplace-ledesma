import { describe, expect, it } from 'vitest'
import { isImageAttachment } from './note-attachment-utils'

describe('isImageAttachment', () => {
  it.each(['radiografia.png', 'foto.jpg', 'foto.JPEG', 'imagen.webp', 'animado.gif'])(
    'reconoce %s como imagen',
    (fileName) => {
      expect(isImageAttachment(fileName)).toBe(true)
    }
  )

  it.each(['analisis.pdf', 'documento.PDF', 'archivo'])('no reconoce %s como imagen', (fileName) => {
    expect(isImageAttachment(fileName)).toBe(false)
  })

  it('no falla con nombre sin extensión ni con punto final', () => {
    expect(isImageAttachment('sin-extension')).toBe(false)
    expect(isImageAttachment('nombre.')).toBe(false)
  })
})
