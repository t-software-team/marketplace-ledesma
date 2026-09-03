'use client'

import { useState, useTransition } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Button } from '@/components/ui/button'
import { acceptGymStaffInviteAndRedirect } from '@/lib/gym/staff-actions'

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const accept = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await acceptGymStaffInviteAndRedirect(token)
        if (result?.error) setError(result.error)
      } catch (err) {
        // acceptGymStaffInviteAndRedirect throws Next's internal redirect
        // signal on success — anything else is a real failure.
        if (isRedirectError(err)) throw err
        console.error('AcceptInviteButton: fallo inesperado al aceptar', err)
        setError('Algo salió mal. Probá de nuevo.')
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="h-11 w-full" onClick={accept} disabled={isPending}>
        {isPending ? 'Aceptando…' : 'Aceptar invitación'}
      </Button>
    </div>
  )
}
