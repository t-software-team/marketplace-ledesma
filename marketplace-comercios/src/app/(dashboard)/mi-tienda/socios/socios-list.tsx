'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { setGymMemberArchived, type ActionState } from '@/lib/gym/actions'
import type { GymMemberStatus, GymMemberWithStatus } from '@/lib/gym/queries'

const STATUS: Record<
  GymMemberStatus,
  { label: string; variant: 'success' | 'warning' | 'outline' }
> = {
  active: { label: 'Activo', variant: 'success' },
  expired: { label: 'Vencido', variant: 'warning' },
  archived: { label: 'Baja', variant: 'outline' },
}

function formatDate(value: string | null) {
  if (!value) return 'Sin membresía'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR')
}

function MemberRow({ member }: { member: GymMemberWithStatus }) {
  const [isPending, startTransition] = useTransition()
  const status = STATUS[member.status]

  const toggleArchived = () => {
    const next = !member.is_archived
    if (next && !confirm(`¿Dar de baja a ${member.full_name}? Su historial se conserva.`)) return
    startTransition(() => {
      void (setGymMemberArchived(member.id, next) as Promise<ActionState>)
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{member.full_name}</p>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {member.phone ? `${member.phone} · ` : ''}
          Vence {formatDate(member.expires_at)}
        </p>
      </div>
      <Button variant="outline" size="sm" disabled={isPending} onClick={toggleArchived}>
        {member.is_archived ? 'Reactivar' : 'Dar de baja'}
      </Button>
    </div>
  )
}

export function SociosList({ members }: { members: GymMemberWithStatus[] }) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} />
      ))}
    </div>
  )
}
