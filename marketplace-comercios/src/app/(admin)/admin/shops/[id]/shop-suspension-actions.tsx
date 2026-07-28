'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { suspendShop, unsuspendShop, type ActionState } from '@/lib/admin/actions'

interface ShopSuspensionActionsProps {
  shopId: string
  isActive: boolean
}

const initialState: ActionState = { error: null }

export function ShopSuspensionActions({ shopId, isActive }: ShopSuspensionActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const suspendAction = suspendShop.bind(null, shopId)
  const [state, formAction, isSuspending] = useActionState(suspendAction, initialState)

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.error === null) setOpen(false)
  }

  useEffect(() => {
    if (state === initialState) return
    if (state.error === null) {
      toast.add({ title: 'Comercio suspendido', type: 'success' })
      router.refresh()
    } else {
      toast.add({ title: 'No pudimos suspender el comercio', description: state.error, type: 'error' })
    }
  }, [state, router])

  function handleUnsuspend() {
    startTransition(async () => {
      try {
        await unsuspendShop(shopId)
        toast.add({ title: 'Comercio reactivado', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos reactivar el comercio', type: 'error' })
      }
    })
  }

  if (isActive) {
    return (
      <>
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Ban className="size-3.5" aria-hidden />
          Suspender comercio
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspender comercio</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="space-y-3">
              <Textarea
                name="reason"
                placeholder="Motivo de la suspensión (se le informa al dueño por email)"
                rows={4}
                required
              />
              {state.error && <p className="text-sm text-destructive">{state.error}</p>}
              <DialogFooter>
                <Button type="submit" variant="destructive" disabled={isSuspending}>
                  {isSuspending ? 'Suspendiendo...' : 'Confirmar suspensión'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={isPending}
      onClick={handleUnsuspend}
    >
      <CircleCheck className="size-3.5" aria-hidden />
      {isPending ? 'Reactivando...' : 'Reactivar comercio'}
    </Button>
  )
}
