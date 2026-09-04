'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { revokeStaff } from '@/lib/shops/staff-actions'

export function RevokeStaffButton({ staffId, email }: { staffId: string; email: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const revoke = () => {
    if (!confirm(`¿Quitar el acceso de ${email}? Va a dejar de poder entrar al panel.`)) return
    startTransition(async () => {
      const res = await revokeStaff(staffId)
      if (res.error) {
        toast.add({ title: 'No pudimos quitar el acceso', description: res.error, type: 'error' })
        return
      }
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="sm" disabled={isPending} onClick={revoke}>
      {isPending ? 'Quitando…' : 'Quitar acceso'}
    </Button>
  )
}
