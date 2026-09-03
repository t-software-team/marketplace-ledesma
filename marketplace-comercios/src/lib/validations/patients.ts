import { z } from 'zod'

export const patientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  species: z.string().max(60).optional().or(z.literal('')),
  breed: z.string().max(60).optional().or(z.literal('')),
  sex: z.string().max(20).optional().or(z.literal('')),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresá una fecha válida')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : null)),
  weight: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : null))
    .refine((val) => val === null || !Number.isNaN(Number(val)), 'El peso debe ser numérico')
    .transform((val) => (val === null ? null : Number(val))),
  notes: z.string().max(2000).optional().or(z.literal('')),
  photo_url: z.string().optional().or(z.literal('')),
  owner_name: z.string().max(100).optional().or(z.literal('')),
  owner_email: z.string().email('Ingresá un email válido').optional().or(z.literal('')),
  owner_phone: z.string().max(30).optional().or(z.literal('')),
})

export type PatientFormValues = z.infer<typeof patientSchema>

export const patientReminderSchema = z.object({
  label: z.string().min(1, 'El texto del recordatorio es obligatorio').max(200),
  due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresá una fecha válida'),
})

export type PatientReminderFormValues = z.infer<typeof patientReminderSchema>

export const patientNoteSchema = z.object({
  content: z.string().min(1, 'El contenido de la nota es obligatorio').max(4000),
})

export type PatientNoteFormValues = z.infer<typeof patientNoteSchema>
