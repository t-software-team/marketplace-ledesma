'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { createGymMember, type ActionState } from '@/lib/gym/actions'

interface PlanOption {
  id: string
  name: string
  price: number
}

const initialState: ActionState = { error: null }

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MemberForm({ plans }: { plans: PlanOption[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createGymMember, initialState)
  const [planId, setPlanId] = useState('')
  const submitted = useRef(false)

  useEffect(() => {
    if (!isPending && submitted.current && !state.error) {
      submitted.current = false
      router.push('/mi-tienda/socios')
    }
  }, [isPending, state, router])

  return (
    <form
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

      <div className="space-y-1">
        <label htmlFor="full_name" className="text-sm font-medium">
          Nombre y apellido
        </label>
        <Input id="full_name" name="full_name" placeholder="Juan Pérez" required autoFocus />
        <FieldError message={state.fieldErrors?.full_name} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Input id="phone" name="phone" inputMode="tel" />
        </div>
        <div className="space-y-1">
          <label htmlFor="document" className="text-sm font-medium">
            Documento <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Input id="document" name="document" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input id="email" name="email" type="email" />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div className="space-y-1">
        <label htmlFor="plan_id" className="text-sm font-medium">
          Plan
        </label>
        <select
          id="plan_id"
          name="plan_id"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className={selectClass}
        >
          <option value="">Sin plan (solo cargar ficha)</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — {formatARS(plan.price)}
            </option>
          ))}
        </select>
      </div>

      {planId && (
        <div className="space-y-1">
          <label htmlFor="payment_method" className="text-sm font-medium">
            Cobro en caja
          </label>
          <select
            id="payment_method"
            name="payment_method"
            defaultValue="cash"
            className={selectClass}
          >
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
          </select>
          <FieldError message={state.fieldErrors?.payment_method} />
          <p className="text-xs text-muted-foreground">
            El vencimiento se calcula automáticamente según la duración del plan.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input id="notes" name="notes" placeholder="Objetivo, lesiones, etc." />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Dando de alta…' : 'Dar de alta'}
      </Button>
    </form>
  )
}
