import { z } from 'zod'

// A membership plan sold by the gym. `duration_days` is the single lever that
// models every modality: 1 = daily drop-in, N = multi-day pass, 30 = monthly.
export const gymPlanKinds = ['daily', 'multi_day', 'monthly', 'custom'] as const

export const gymPlanSchema = z.object({
  name: z.string().trim().min(1, 'Poné un nombre').max(60, 'Máximo 60 caracteres'),
  kind: z.enum(gymPlanKinds),
  duration_days: z.coerce
    .number()
    .int('Días inválidos')
    .min(1, 'Mínimo 1 día')
    .max(3650, 'Máximo 10 años'),
  price: z.coerce.number().min(0, 'Precio inválido'),
  is_active: z.boolean().default(true),
})

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))

// Quick alta: only the name is required. If a plan is chosen, a membership +
// payment are created in the same transaction (payment collected at the desk).
export const gymMemberSchema = z.object({
  full_name: z.string().trim().min(1, 'Poné el nombre').max(120, 'Máximo 120 caracteres'),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  document: optionalText(40),
  notes: optionalText(500),
  plan_id: z.string().uuid('Elegí un plan válido').optional().or(z.literal('')),
  payment_method: z.enum(['cash', 'transfer']).optional(),
})

// Edit an existing member's ficha (no plan/payment involved).
export const gymMemberUpdateSchema = z.object({
  member_id: z.string().uuid(),
  full_name: z.string().trim().min(1, 'Poné el nombre').max(120, 'Máximo 120 caracteres'),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  document: optionalText(40),
  notes: optionalText(500),
})

// Renew / add a new membership period to an existing member.
export const gymRenewalSchema = z.object({
  member_id: z.string().uuid(),
  plan_id: z.string().uuid('Elegí un plan válido'),
  payment_method: z.enum(['cash', 'transfer']),
})
