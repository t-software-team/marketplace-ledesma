import { z } from 'zod'

const TREATMENT_TYPES = ['vacuna', 'desparasitacion'] as const
const SPECIES = ['perro', 'gato', 'otro'] as const

const numberField = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((val) => (val ? val : null))
  .refine((val) => val === null || !Number.isNaN(Number(val)), 'Debe ser numérico')
  .transform((val) => (val === null ? null : Number(val)))

// Una dosis de la secuencia de una plantilla. dose_number se asigna por orden
// en la lista (no lo manda el form). age_weeks solo tiene sentido en la
// primera dosis; interval_days_after_previous en las siguientes.
export const treatmentDoseSchema = z.object({
  label: z.string().min(1, 'La etiqueta es obligatoria').max(100),
  age_weeks: numberField,
  interval_days_after_previous: numberField,
  is_recurring: z.boolean().default(false),
  recurrence_interval_days: numberField,
})

export type TreatmentDoseFormValues = z.infer<typeof treatmentDoseSchema>

// Secuencia completa: dose_number consecutivo desde 1 (implícito por orden),
// solo la ÚLTIMA dosis puede ser is_recurring=true, y si lo es debe traer
// recurrence_interval_days.
export const treatmentDoseSequenceSchema = z
  .array(treatmentDoseSchema)
  .min(1, 'Agregá al menos una dosis')
  .superRefine((doses, ctx) => {
    doses.forEach((dose, index) => {
      const isLast = index === doses.length - 1

      if (dose.is_recurring && !isLast) {
        ctx.addIssue({
          code: 'custom',
          message: 'Solo la última dosis de la secuencia puede repetirse indefinidamente',
          path: [index, 'is_recurring'],
        })
      }

      if (dose.is_recurring && dose.recurrence_interval_days === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indicá cada cuántos días se repite',
          path: [index, 'recurrence_interval_days'],
        })
      }

      if (index > 0 && dose.interval_days_after_previous === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indicá cuántos días después de la dosis anterior corresponde',
          path: [index, 'interval_days_after_previous'],
        })
      }
    })
  })

export const treatmentTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  type: z.enum(TREATMENT_TYPES, { message: 'Elegí un tipo válido' }),
  species: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : null))
    .refine((val) => val === null || (SPECIES as readonly string[]).includes(val), 'Elegí una especie válida'),
  doses: treatmentDoseSequenceSchema,
})

export type TreatmentTemplateFormValues = z.infer<typeof treatmentTemplateSchema>

export const treatmentApplicationSchema = z.object({
  template_id: z.string().min(1, 'Elegí una plantilla'),
  template_dose_id: z.string().optional().or(z.literal('')).transform((val) => (val ? val : null)),
  applied_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresá una fecha válida'),
  product_name: z.string().max(200).optional().or(z.literal('')).transform((val) => (val ? val : null)),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export type TreatmentApplicationFormValues = z.infer<typeof treatmentApplicationSchema>
