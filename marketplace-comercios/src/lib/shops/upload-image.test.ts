import { describe, expect, it } from 'vitest'
import { uploadPatientDocument } from './upload-image'

// RED test (PR7a, 7a.5): mismo criterio de validación que
// `uploadVerificationDocument` — tipo de archivo no soportado se rechaza
// ANTES de intentar cualquier llamada de red a Storage.
describe('uploadPatientDocument', () => {
  it('rejects unsupported file types', async () => {
    const file = new File(['contenido'], 'nota.txt', { type: 'text/plain' })

    await expect(uploadPatientDocument('shop-1', 'patient-1', file)).rejects.toThrow(
      'El documento debe ser una imagen o un PDF'
    )
  })

  it('rejects files above the 10MB limit', async () => {
    const oversized = new Uint8Array(11 * 1024 * 1024)
    const file = new File([oversized], 'radiografia.pdf', { type: 'application/pdf' })

    await expect(uploadPatientDocument('shop-1', 'patient-1', file)).rejects.toThrow(
      'no puede pesar más de 10MB'
    )
  })
})
