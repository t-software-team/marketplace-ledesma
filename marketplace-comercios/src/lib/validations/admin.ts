import { z } from 'zod'
import { uuidLike } from './uuid'

export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z
    .string()
    .min(2, 'La URL debe tener al menos 2 caracteres')
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Usá solo minúsculas, números y guiones'),
  parent_id: uuidLike('Elegí una categoría padre válida').optional().or(z.literal('')),
  icon_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export const rejectionReasonSchema = z.object({
  reason: z.string().min(5, 'Ingresá un motivo de al menos 5 caracteres').max(500),
})

export type RejectionReasonFormValues = z.infer<typeof rejectionReasonSchema>

export const subscriptionPlanSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  price: z
    .string()
    .min(1, 'Ingresá un precio')
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, 'Ingresá un precio válido'),
  duration_days: z
    .string()
    .min(1, 'Ingresá la duración')
    .refine(
      (val) => Number.isInteger(Number(val)) && Number(val) > 0,
      'Ingresá una duración en días válida'
    ),
  benefits_text: z.string().max(2000).optional().or(z.literal('')),
  is_active: z.boolean(),
  applies_to: z.enum(['all', 'product', 'service']).default('all'),
})

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanSchema>
