'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ActionState } from '@/lib/admin/actions'

interface PlanFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: {
    name: string
    description: string | null
    price: number
    duration_days: number
    benefits: unknown
    is_active: boolean
  }
  submitLabel: string
}

const initialState: ActionState = { error: null }

export function PlanForm({ action, defaultValues, submitLabel }: PlanFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ''} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Precio
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.price}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="duration_days" className="text-sm font-medium">
            Duración (días)
          </label>
          <Input
            id="duration_days"
            name="duration_days"
            type="number"
            min="1"
            step="1"
            defaultValue={defaultValues?.duration_days}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="benefits_text" className="text-sm font-medium">
          Beneficios (JSON)
        </label>
        <Textarea
          id="benefits_text"
          name="benefits_text"
          rows={5}
          placeholder='{"max_products": 100, "featured": true}'
          defaultValue={
            defaultValues?.benefits ? JSON.stringify(defaultValues.benefits, null, 2) : ''
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValues?.is_active ?? true}
          className="size-4"
        />
        Plan activo
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  )
}
