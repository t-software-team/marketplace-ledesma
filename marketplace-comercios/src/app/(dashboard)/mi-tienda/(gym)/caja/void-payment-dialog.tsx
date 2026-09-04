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
import { voidGymPayment } from '@/lib/gym/actions'
import type { ActionState } from '@/lib/admin/actions/shared'

const initialState: ActionState = { error: null }

export function VoidPaymentDialog({ paymentId, amountLabel }: { paymentId: string; amountLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const action = voidGymPayment.bind(null, paymentId)
  const [state, formAction, isPending] = useActionState(action, initialState)
  const submitted = useRef(false)

  useEffect(() => {
    if (!isPending && submitted.current && !state.error) {
      submitted.current = false
      setOpen(false)
      router.refresh()
    }
  }, [isPending, state, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Anular</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Anular pago</DialogTitle>
          <DialogDescription>
            {amountLabel} deja de contar en caja. Queda visible en el historial con el motivo, no se
            borra.
          </DialogDescription>
        </DialogHeader>

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
            <label htmlFor="void-reason" className="text-sm font-medium">
              Motivo
            </label>
            <textarea
              id="void-reason"
              name="reason"
              required
              rows={2}
              placeholder="Ej: monto cargado mal, cobro duplicado…"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Anulando…' : 'Anular pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
