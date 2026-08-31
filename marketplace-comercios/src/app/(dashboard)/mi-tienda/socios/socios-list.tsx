'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { setGymMemberArchived } from '@/lib/gym/actions'
import type { GymMemberStatus, GymMemberWithStatus } from '@/lib/gym/queries'
import { RenewMemberDialog } from './renew-member-dialog'
import { EditMemberDialog } from './edit-member-dialog'

interface PlanOption {
  id: string
  name: string
  price: number
}

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

function MemberRow({ member, plans }: { member: GymMemberWithStatus; plans: PlanOption[] }) {
  const [isPending, startTransition] = useTransition()
  const status = STATUS[member.status]

  const toggleArchived = () => {
    const next = !member.is_archived
    if (next && !confirm(`¿Dar de baja a ${member.full_name}? Su historial se conserva.`)) return
    startTransition(async () => {
      const res = await setGymMemberArchived(member.id, next)
      if (res.error) {
        console.error('SociosList: fallo al cambiar el estado del socio', {
          memberId: member.id,
          next,
          error: res.error,
        })
        toast.add({ title: 'No pudimos actualizar al socio', description: res.error, type: 'error' })
      }
    })
  }

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/mi-tienda/socios/${member.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {member.full_name}
        </Link>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {member.document || '—'}
      </TableCell>
      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(member.expires_at)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {member.phone || '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {!member.is_archived && (
            <>
              <EditMemberDialog member={member} />
              <RenewMemberDialog memberId={member.id} plans={plans} />
            </>
          )}
          <Button variant="ghost" size="sm" disabled={isPending} onClick={toggleArchived}>
            {member.is_archived ? 'Reactivar' : 'Baja'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function SociosList({
  members,
  plans,
}: {
  members: GymMemberWithStatus[]
  plans: PlanOption[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Socio</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vence</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberRow key={member.id} member={member} plans={plans} />
        ))}
      </TableBody>
    </Table>
  )
}
