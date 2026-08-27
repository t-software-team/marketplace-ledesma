'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { checkInGymMember, type CheckInResult } from '@/lib/gym/actions'
import type { GymMemberStatus } from '@/lib/gym/queries'

interface SearchableMember {
  id: string
  full_name: string
  status: GymMemberStatus
  expires_at: string | null
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR')
}

export function CheckInClient({ members }: { members: SearchableMember[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return members.filter((m) => m.full_name.toLowerCase().includes(q)).slice(0, 8)
  }, [members, search])

  const register = (memberId: string) => {
    startTransition(async () => {
      const res = await checkInGymMember(memberId)
      setResult(res)
      if (!res.error) {
        setSearch('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {result && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            result.error
              ? 'border-destructive bg-destructive/10 text-destructive'
              : result.status === 'active'
                ? 'border-success bg-success/20 text-success-foreground'
                : 'border-warning bg-warning/20 text-warning-foreground'
          }`}
        >
          {result.error ? (
            result.error
          ) : result.status === 'active' ? (
            <>
              ✓ Ingreso registrado — <strong>{result.member_name}</strong>. Membresía vigente hasta{' '}
              {formatDate(result.expires_at)}.
            </>
          ) : (
            <>
              ⚠ Ingreso registrado — <strong>{result.member_name}</strong>, pero su membresía está{' '}
              <strong>vencida</strong>. Conviene renovar.
            </>
          )}
        </div>
      )}

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar socio por nombre…"
        autoFocus
      />

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{m.full_name}</p>
                <p className="text-xs text-muted-foreground">Vence {formatDate(m.expires_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.status === 'expired' && <Badge variant="warning">Vencido</Badge>}
                <Button size="sm" disabled={isPending} onClick={() => register(m.id)}>
                  Registrar ingreso
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {search.trim() && matches.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay socios que coincidan.</p>
      )}
    </div>
  )
}
