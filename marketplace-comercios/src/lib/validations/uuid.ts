import { z } from 'zod'

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function uuidLike(message = 'Valor inválido') {
  return z.string().regex(UUID_LIKE, message)
}
