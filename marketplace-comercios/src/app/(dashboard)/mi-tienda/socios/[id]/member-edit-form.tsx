'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { updateGymMember, type ActionState } from '@/lib/gym/actions'
import type { GymMemberDetail } from '@/lib/gym/queries'

const initialState: ActionState = { error: null }

export function MemberEditForm({ member }: { member: GymMemberDetail }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [state, formAction, isPending] = useActionState(updateGymMember, initialState)
  const [saved, setSaved] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    if (!isPending && submitted.current && !state.error) {
      submitted.current = false
      setEditing(false)
      setSaved(true)
      router.refresh()
    }
  }, [isPending, state, router])

  if (!editing) {
    return (
      <div className="space-y-2">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Teléfono</dt>
            <dd>{member.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Documento</dt>
            <dd>{member.document || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="truncate">{member.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Notas</dt>
            <dd>{member.notes || '—'}</dd>
          </div>
        </dl>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar datos
          </Button>
          {saved && <span className="text-xs text-success-foreground">Guardado ✓</span>}
        </div>
      </div>
    )
  }

  return (
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

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
