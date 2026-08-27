'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { createGymPlan, type ActionState } from '@/lib/gym/actions'
import { gymPlanKinds } from '@/lib/validations/gym'

const initialState: ActionState = { error: null }

const KIND_LABELS: Record<(typeof gymPlanKinds)[number], string> = {
  daily: 'Diario (1 día)',
  multi_day: 'Por días',
  monthly: 'Mensual (30 días)',
  custom: 'Personalizado',
}

// Suggested durations so the desk doesn't have to think about the number.
const KIND_DEFAULT_DAYS: Record<(typeof gymPlanKinds)[number], number> = {
  daily: 1,
  multi_day: 7,
  monthly: 30,
  custom: 30,
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function PlanForm() {
  const [state, formAction, isPending] = useActionState(createGymPlan, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const daysRef = useRef<HTMLInputElement>(null)
  const submitted = useRef(false)

  useEffect(() => {
    if (!isPending && submitted.current && !state.error) {
      formRef.current?.reset()
      submitted.current = false
    }
  }, [isPending, state])

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        submitted.current = true
      }}
      className="space-y-3"
    >
      {state.error && (
        <p className="rounded-lg border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="plan-name" className="text-sm font-medium">
            Nombre
          </label>
          <Input id="plan-name" name="name" placeholder="Ej: Mensual full" required />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div className="space-y-1">
          <label htmlFor="plan-kind" className="text-sm font-medium">
            Modalidad
          </label>
          <select
            id="plan-kind"
            name="kind"
            defaultValue="monthly"
            className={selectClass}
            onChange={(e) => {
              const kind = e.target.value as (typeof gymPlanKinds)[number]
              if (daysRef.current) daysRef.current.value = String(KIND_DEFAULT_DAYS[kind])
            }}
          >
            {gymPlanKinds.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.kind} />
        </div>

        <div className="space-y-1">
          <label htmlFor="plan-days" className="text-sm font-medium">
            Duración (días)
          </label>
          <Input
            ref={daysRef}
            id="plan-days"
            name="duration_days"
            type="number"
            min={1}
            defaultValue={30}
            required
          />
          <FieldError message={state.fieldErrors?.duration_days} />
        </div>

        <div className="space-y-1">
          <label htmlFor="plan-price" className="text-sm font-medium">
            Precio (ARS)
          </label>
          <Input id="plan-price" name="price" type="number" min={0} step="1" defaultValue={0} />
          <FieldError message={state.fieldErrors?.price} />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando…' : 'Crear plan'}
      </Button>
    </form>
  )
}
