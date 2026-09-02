import { describe, expect, it } from 'vitest'
import {
  createShopSchema,
  productSchema,
  reportShopSchema,
  shopReviewSchema,
  shopSettingsSchema,
  whatsappNumberSchema,
} from './shop'

describe('whatsappNumberSchema', () => {
  it('acepta un número con código de país', () => {
    expect(whatsappNumberSchema.safeParse('+54 9 11 1234-5678').success).toBe(true)
  })

  it('acepta un número sin formateo', () => {
    expect(whatsappNumberSchema.safeParse('5491112345678').success).toBe(true)
  })

  it('rechaza un número demasiado corto', () => {
    expect(whatsappNumberSchema.safeParse('123').success).toBe(false)
  })

  it('rechaza texto sin dígitos', () => {
    expect(whatsappNumberSchema.safeParse('no-tengo-whatsapp').success).toBe(false)
  })

  it('rechaza un número que empieza en 0', () => {
    // el regex exige [1-9] como primer dígito tras sanitizar
    expect(whatsappNumberSchema.safeParse('0111234567').success).toBe(false)
  })
})

describe('createShopSchema', () => {
  const valid = { name: 'Mi Tienda', slug: 'mi-tienda', whatsapp_number: '+5491112345678' }

  it('acepta datos válidos', () => {
    expect(createShopSchema.safeParse(valid).success).toBe(true)
  })

  it('rechaza slug con mayúsculas o espacios', () => {
    expect(createShopSchema.safeParse({ ...valid, slug: 'Mi Tienda' }).success).toBe(false)
  })

  it('rechaza nombre muy corto', () => {
    expect(createShopSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false)
  })
})

describe('shopSettingsSchema', () => {
  const base = {
    name: 'Mi Tienda',
    slug: 'mi-tienda',
    whatsapp_number: '+5491112345678',
    is_paused: false,
  }

  it('acepta el mínimo requerido con opcionales vacíos', () => {
    const result = shopSettingsSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('rechaza un email inválido', () => {
    const result = shopSettingsSchema.safeParse({ ...base, email: 'no-es-un-email' })
    expect(result.success).toBe(false)
  })

  it('rechaza una URL de Instagram inválida', () => {
    const result = shopSettingsSchema.safeParse({ ...base, instagram_url: 'instagram.com/x' })
    expect(result.success).toBe(false)
  })

  it('acepta un category_id con formato UUID', () => {
    const result = shopSettingsSchema.safeParse({
      ...base,
      category_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza un category_id que no tiene forma de UUID', () => {
    const result = shopSettingsSchema.safeParse({ ...base, category_id: 'no-es-un-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('productSchema', () => {
  const base = { name: 'Producto de prueba', currency: 'ARS', is_active: true }

  it('acepta un precio numérico como string', () => {
    expect(productSchema.safeParse({ ...base, price: '1500.50' }).success).toBe(true)
  })

  it('rechaza un precio no numérico', () => {
    expect(productSchema.safeParse({ ...base, price: 'gratis' }).success).toBe(false)
  })

  it('parsea image_urls JSON válido a array de strings', () => {
    const result = productSchema.safeParse({
      ...base,
      image_urls: JSON.stringify(['https://a.com/1.png', 'https://a.com/2.png']),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image_urls).toEqual(['https://a.com/1.png', 'https://a.com/2.png'])
    }
  })

  it('devuelve array vacío si image_urls es JSON inválido, sin tirar error', () => {
    const result = productSchema.safeParse({ ...base, image_urls: '{not valid json' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image_urls).toEqual([])
    }
  })

  it('acepta stock vacío (sin control de stock)', () => {
    const result = productSchema.safeParse({ ...base, stock: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stock).toBe('')
    }
  })

  it('acepta stock en 0', () => {
    expect(productSchema.safeParse({ ...base, stock: '0' }).success).toBe(true)
  })

  it('acepta un stock entero positivo', () => {
    expect(productSchema.safeParse({ ...base, stock: '15' }).success).toBe(true)
  })

  it('rechaza un stock negativo', () => {
    expect(productSchema.safeParse({ ...base, stock: '-3' }).success).toBe(false)
  })

  it('rechaza un stock decimal', () => {
    expect(productSchema.safeParse({ ...base, stock: '2.5' }).success).toBe(false)
  })
})

describe('shopReviewSchema', () => {
  it('acepta un rating entre 1 y 5', () => {
    expect(shopReviewSchema.safeParse({ rating: '4' }).success).toBe(true)
  })

  it('rechaza un rating de 0', () => {
    expect(shopReviewSchema.safeParse({ rating: '0' }).success).toBe(false)
  })

  it('rechaza un rating mayor a 5', () => {
    expect(shopReviewSchema.safeParse({ rating: '6' }).success).toBe(false)
  })

  it('rechaza un comentario demasiado largo', () => {
    const result = shopReviewSchema.safeParse({ rating: '5', comment: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

describe('reportShopSchema', () => {
  it('acepta un motivo válido del enum', () => {
    expect(reportShopSchema.safeParse({ reason: 'scam' }).success).toBe(true)
  })

  it('rechaza un motivo fuera del enum', () => {
    expect(reportShopSchema.safeParse({ reason: 'porque-si' }).success).toBe(false)
  })
})
