'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/shared/field-error'
import { renewGymMembership, type ActionState } from '@/lib/gym/actions'

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

interface RenewMemberDialogProps {
  memberId: string
  plans: PlanOption[]
  triggerLabel?: string
  triggerVariant?: 'default' | 'outline' | 'ghost'
  triggerSize?: 'sm' | 'default'
}

export function RenewMemberDialog({
  memberId,
  plans,
  triggerLabel = 'Renovar',
  triggerVariant = 'outline',
  triggerSize = 'sm',
}: RenewMemberDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(renewGymMembership, initialState)
  const submitted = useRef(false)

  useEffect(() => {
    if (!isPending && submitted.current && !state.error) {
      submitted.current = false
      setOpen(false)
      router.refresh()
    }
  }, [isPending, state, router])

  const disabled = plans.length === 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={triggerVariant} size={triggerSize} disabled={disabled}>
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Renovar membresía</DialogTitle>
          <DialogDescription>
            Se crea un nuevo período con su vencimiento y se registra el cobro en caja.
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          onSubmit={() => {
            submitted.current = true
          }}
          className="space-y-3"
        >
          <input type="hidden" name="member_id" value={memberId} />

          {state.error && (
            <p className="rounded-lg border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="renew-plan" className="text-sm font-medium">
              Plan
            </label>
            <select id="renew-plan" name="plan_id" className={selectClass} required>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {formatARS(plan.price)}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.plan_id} />
          </div>

          <div className="space-y-1">
            <label htmlFor="renew-payment" className="text-sm font-medium">
              Cobro en caja
            </label>
            <select
              id="renew-payment"
              name="payment_method"
              defaultValue="cash"
              className={selectClass}
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Renovando…' : 'Confirmar renovación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
