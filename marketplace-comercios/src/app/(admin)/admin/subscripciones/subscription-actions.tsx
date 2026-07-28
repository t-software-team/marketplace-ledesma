'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import {
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  type ActionState,
} from '@/lib/admin/actions'

interface SubscriptionActionsProps {
  subscriptionId: string
}

const initialState: ActionState = { error: null }

export function SubscriptionActions({ subscriptionId }: SubscriptionActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const rejectAction = rejectSubscriptionRequest.bind(null, subscriptionId)
  const [state, formAction, isRejecting] = useActionState(rejectAction, initialState)

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.error === null) setOpen(false)
  }

  useEffect(() => {
    if (state === initialState) return
    if (state.error === null) {
      toast.add({ title: 'Suscripción rechazada', type: 'success' })
      router.refresh()
    } else {
      toast.add({ title: 'No pudimos rechazar la suscripción', description: state.error, type: 'error' })
    }
  }, [state, router])

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveSubscriptionRequest(subscriptionId)
        toast.add({ title: 'Suscripción aprobada', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos aprobar la suscripción', type: 'error' })
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button disabled={isPending} onClick={handleApprove}>
        Aprobar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="destructive" />}>Rechazar</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar suscripción</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-3">
            <Textarea
              name="reason"
              placeholder="Indicá el motivo del rechazo"
              rows={4}
              required
            />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isRejecting}>
                {isRejecting ? 'Rechazando...' : 'Confirmar rechazo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
