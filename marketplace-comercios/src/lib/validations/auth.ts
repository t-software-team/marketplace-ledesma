import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>
