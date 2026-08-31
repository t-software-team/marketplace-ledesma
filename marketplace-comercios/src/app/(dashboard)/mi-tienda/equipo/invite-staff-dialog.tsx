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
import { Input } from '@/components/ui/input'
import { UserPlus } from 'lucide-react'
import { inviteGymStaff } from '@/lib/gym/staff-actions'
import type { ActionState } from '@/lib/gym/actions'

const initialState: ActionState = { error: null }

export function InviteStaffDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(inviteGymStaff, initialState)
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
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="mr-2 size-4" aria-hidden />
        Invitar empleado
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invitar empleado</DialogTitle>
          <DialogDescription>
            Le mandamos un email para que cree su propia cuenta. Va a poder registrar ingresos, dar de
            alta socios y renovar membresías — nada de caja, planes ni configuración.
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
            <label htmlFor="staff-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="staff-email"
              name="email"
              type="email"
              placeholder="empleado@ejemplo.com"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enviando…' : 'Enviar invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
