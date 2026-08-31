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
import { FieldError } from '@/components/shared/field-error'
import { updateGymMember, type ActionState } from '@/lib/gym/actions'
import type { GymMemberWithStatus } from '@/lib/gym/queries'

const initialState: ActionState = { error: null }

export function EditMemberDialog({ member }: { member: GymMemberWithStatus }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(updateGymMember, initialState)
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
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar socio</DialogTitle>
          <DialogDescription>Actualizá los datos de contacto de {member.full_name}.</DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          onSubmit={() => {
            submitted.current = true
          }}
          className="space-y-3"
        >
          <input type="hidden" name="member_id" value={member.id} />

          {state.error && (
            <p className="rounded-lg border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Nombre y apellido
            </label>
            <Input id="edit-name" name="full_name" defaultValue={member.full_name} required />
            <FieldError message={state.fieldErrors?.full_name} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="edit-phone" className="text-sm font-medium">
                Teléfono
              </label>
              <Input id="edit-phone" name="phone" defaultValue={member.phone ?? ''} inputMode="tel" />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-document" className="text-sm font-medium">
                Documento
              </label>
              <Input id="edit-document" name="document" defaultValue={member.document ?? ''} />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-email" className="text-sm font-medium">
              Email
            </label>
            <Input id="edit-email" name="email" type="email" defaultValue={member.email ?? ''} />
            <FieldError message={state.fieldErrors?.email} />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-notes" className="text-sm font-medium">
              Notas
            </label>
            <Input id="edit-notes" name="notes" defaultValue={member.notes ?? ''} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
