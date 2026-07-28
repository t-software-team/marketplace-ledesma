import { describe, expect, it } from 'vitest'
import { uuidLike } from './uuid'

describe('uuidLike', () => {
  const schema = uuidLike()

  it('acepta un UUID real', () => {
    expect(schema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('acepta los UUIDs fake usados en seed.sql', () => {
    // Zod v4 .uuid() rechaza estos por los nibbles de versión/variante,
    // por eso el proyecto usa un regex laxo en vez de z.string().uuid().
    expect(schema.safeParse('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').success).toBe(true)
  })

  it('rechaza un string que no tiene forma de UUID', () => {
    expect(schema.safeParse('no-es-un-uuid').success).toBe(false)
  })

  it('rechaza un UUID con la cantidad de caracteres incorrecta', () => {
    expect(schema.safeParse('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa').success).toBe(false)
  })
})
