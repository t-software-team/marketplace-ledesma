import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  avatar_url: z.string().optional().or(z.literal('')),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
