'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { createTreatmentTemplate, updateTreatmentTemplate, type TreatmentActionState } from '@/lib/treatments/actions'
import type { TreatmentTemplateWithDoses } from '@/lib/treatments/queries'
import { TreatmentDosesEditor } from './treatment-doses-editor'

const TYPES = [
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'desparasitacion', label: 'Desparasitación' },
]

const SPECIES = [
  { value: '', label: 'Cualquiera' },
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'otro', label: 'Otro' },
]

interface TreatmentTemplateFormProps {
  template?: TreatmentTemplateWithDoses
  submitLabel: string
}

const initialState: TreatmentActionState = { error: null }

export function TreatmentTemplateForm({ template, submitLabel }: TreatmentTemplateFormProps) {
  const action = template ? updateTreatmentTemplate.bind(null, template.id) : createTreatmentTemplate
  const [state, formAction, isPending] = useActionState(action, initialState)
  const fieldErrors = state.fieldErrors ?? {}

  useEffect(() => {
    if (state.error) {
      toast.add({ title: 'No pudimos guardar la plantilla', description: state.error, type: 'error' })
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={template?.name}
            required
            aria-invalid={Boolean(fieldErrors.name)}
          />
          <FieldError message={fieldErrors.name} />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={template?.type ?? 'vacuna'}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.type} />
        </div>
        <div className="space-y-2">
          <label htmlFor="species" className="text-sm font-medium">
            Especie
          </label>
          <select
            id="species"
            name="species"
            defaultValue={template?.species ?? ''}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {SPECIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.species} />
        </div>
      </div>

      <TreatmentDosesEditor initialDoses={template?.doses} />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  )
}
