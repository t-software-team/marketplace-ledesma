import { z } from 'zod'
import { uuidLike } from './uuid'

export const whatsappNumberSchema = z
  .string()
  .min(8, 'Ingresá un número de WhatsApp válido')
  .refine((val) => {
    const digitsOnly = val.replace(/\D/g, '')
    return /^[1-9]\d{7,14}$/.test(digitsOnly)
  }, 'Ingresá el número con código de país (ej: +54 9 11 1234-5678)')

export const createShopSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z
    .string()
    .min(3, 'La URL debe tener al menos 3 caracteres')
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Usá solo minúsculas, números y guiones'),
  whatsapp_number: whatsappNumberSchema,
  category_id: uuidLike('Elegí un rubro'),
})

export type CreateShopFormValues = z.infer<typeof createShopSchema>

export const shopSettingsSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z
    .string()
    .min(3, 'La URL debe tener al menos 3 caracteres')
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Usá solo minúsculas, números y guiones'),
  description: z.string().max(4000).optional().or(z.literal('')),
  whatsapp_number: whatsappNumberSchema,
  email: z.string().email('Ingresá un email válido').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  category_id: uuidLike('Elegí un rubro válido').optional().or(z.literal('')),
  instagram_url: z
    .string()
    .url('Ingresá una URL válida')
    .optional()
    .or(z.literal('')),
  facebook_url: z
    .string()
    .url('Ingresá una URL válida')
    .optional()
    .or(z.literal('')),
  website_url: z
    .string()
    .url('Ingresá una URL válida')
    .optional()
    .or(z.literal('')),
  business_hours_text: z.string().max(2000).optional().or(z.literal('')),
  is_paused: z.boolean(),
  paused_reason: z.string().max(300).optional().or(z.literal('')),
  logo_url: z.string().optional().or(z.literal('')),
  cover_url: z.string().optional().or(z.literal('')),
})

export type ShopSettingsFormValues = z.infer<typeof shopSettingsSchema>

export const personalizationSchema = z.object({
  accent_color: z.string().optional().or(z.literal('')),
  landing_banner_text: z.string().max(2000).optional().or(z.literal('')),
  landing_services_text: z.string().max(4000).optional().or(z.literal('')),
  landing_gallery_text: z.string().max(4000).optional().or(z.literal('')),
  landing_video_url: z
    .string()
    .url('Ingresá una URL válida')
    .optional()
    .or(z.literal('')),
})

export type PersonalizationFormValues = z.infer<typeof personalizationSchema>

const httpUrlSchema = z
  .string()
  .url('Ingresá una URL válida')
  .refine((url) => /^https?:\/\//i.test(url), 'La URL debe empezar con http:// o https://')

export const landingBannerSchema = z.object({
  title: z.string().min(1).max(80),
  subtitle: z.string().max(200).optional().or(z.literal('')),
  image_url: z.string().optional().or(z.literal('')),
  images: z.array(z.string()).max(6).optional(),
  cta_label: z.string().max(40).optional().or(z.literal('')),
  cta_url: httpUrlSchema.optional().or(z.literal('')),
})

export const landingServiceSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(200).optional().or(z.literal('')),
})

export const landingServicesSchema = z.array(landingServiceSchema).max(6)

export const landingGallerySchema = z.array(z.string()).max(8)

export const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  price: z
    .string()
    .optional()
    .refine((val) => !val || !Number.isNaN(Number(val)), 'Ingresá un precio válido'),
  currency: z.string().default('ARS'),
  category_id: uuidLike('Elegí una subcategoría válida').optional().or(z.literal('')),
  is_active: z.boolean(),
  image_urls: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return [] as string[]
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string') : []
      } catch (error) {
        console.error('productSchema: image_urls inválido', { error })
        return [] as string[]
      }
    }),
  video_url: z.string().optional().or(z.literal('')),
  variants: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val, ctx) => {
      if (!val) return [] as { name: string; price: number }[]
      try {
        const parsed = JSON.parse(val)
        if (!Array.isArray(parsed)) return []
        return parsed
          .filter(
            (item): item is { name: string; price: number } =>
              typeof item?.name === 'string' &&
              item.name.trim().length > 0 &&
              !Number.isNaN(Number(item.price))
          )
          .map((item) => ({ name: item.name.trim(), price: Number(item.price) }))
      } catch (error) {
        ctx.addIssue({ code: 'custom', message: 'Opciones inválidas' })
        console.error('productSchema: variants inválido', { error })
        return []
      }
    }),
  attributes: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return {} as Record<string, string | string[]>
      try {
        const parsed = JSON.parse(val)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        return parsed as Record<string, string | string[]>
      } catch (error) {
        console.error('productSchema: attributes inválido', { error })
        return {}
      }
    }),
})

export type ProductFormValues = z.infer<typeof productSchema>

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido')

export const categorySuggestionSchema = z.object({
  name: z
    .string()
    .min(2, 'Ingresá al menos 2 caracteres')
    .max(60, 'Máximo 60 caracteres'),
  parent_id: uuidLike('Rubro inválido').optional().or(z.literal('')),
})

export const promotionSchema = z.object({
  image_url: z.string().min(1, 'Subí una imagen para la promoción'),
  text: z.string().max(300).optional().or(z.literal('')),
  product_id: uuidLike('Elegí un producto válido').optional().or(z.literal('')),
  duration_days: z.coerce.number().int().min(1).max(3),
  text_position: z.enum(['top', 'center', 'bottom']).default('bottom'),
  text_size: z.enum(['sm', 'md', 'lg']).default('md'),
  text_color: hexColor.default('#ffffff'),
  bg_color: hexColor.default('#000000'),
})

export type PromotionFormValues = z.infer<typeof promotionSchema>

export const reportShopSchema = z.object({
  reason: z.enum(['fake_product', 'scam', 'inappropriate', 'closed_permanently', 'other']),
  comment: z.string().max(1000).optional().or(z.literal('')),
})

export type ReportShopFormValues = z.infer<typeof reportShopSchema>

export const shopReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Elegí una calificación').max(5),
  comment: z.string().max(500).optional().or(z.literal('')),
})

export type ShopReviewFormValues = z.infer<typeof shopReviewSchema>
