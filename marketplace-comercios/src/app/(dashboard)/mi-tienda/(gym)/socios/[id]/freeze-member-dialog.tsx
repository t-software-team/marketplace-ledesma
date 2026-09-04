'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { freezeGymMembership } from '@/lib/gym/actions'

export function FreezeMemberDialog({
  memberId,
  canFreeze,
}: {
  memberId: string
  canFreeze: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState('7')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sin el benefit del Plan Gimnasio, el botón lleva al upsell.
  if (!canFreeze) {
    return (
      <Button
        render={<Link href="/mi-tienda/suscripcion" />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Congelar (Plan Gimnasio)
      </Button>
    )
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await freezeGymMembership(memberId, Number(days))
        if (res.error) {
          setError(res.error)
          return
        }
        setOpen(false)
        router.refresh()
      } catch (err) {
        console.error('FreezeMemberDialog: fallo al congelar', err)
        setError('No pudimos congelar la membresía. Reintentá.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Congelar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Congelar membresía</DialogTitle>
          <DialogDescription>
            Extiende el vencimiento los días que el socio no va a asistir (vacaciones, lesión).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="freeze-days" className="text-sm font-medium">
            Días a congelar
          </label>
          <Input
            id="freeze-days"
            type="number"
            min={1}
            max={180}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Congelando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
