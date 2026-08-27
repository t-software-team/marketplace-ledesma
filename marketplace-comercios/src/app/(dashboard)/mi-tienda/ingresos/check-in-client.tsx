'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  checkInGymMember,
  searchGymMembers,
  type CheckInResult,
} from '@/lib/gym/actions'
import type { GymMemberSearchResult } from '@/lib/gym/queries'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR')
}

export function CheckInClient() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [matches, setMatches] = useState<GymMemberSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // Debounced server-side search — only the matches travel to the client,
  // never the whole roster. The `ignore` guard drops stale responses.
  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setMatches([])
      setSearching(false)
      return
    }

    let ignore = false
    setSearching(true)
    const handle = setTimeout(async () => {
      try {
        const res = await searchGymMembers(q)
        if (!ignore) setMatches(res)
      } catch (err) {
        console.error('CheckInClient: fallo la búsqueda de socios', err)
        if (!ignore) setMatches([])
      } finally {
        if (!ignore) setSearching(false)
      }
    }, 250)

    return () => {
      ignore = true
      clearTimeout(handle)
    }
  }, [search])

  const register = (memberId: string) => {
    startTransition(async () => {
      try {
        const res = await checkInGymMember(memberId)
        setResult(res)
        if (!res.error) {
          setSearch('')
          setMatches([])
          router.refresh()
        }
      } catch (err) {
        console.error('CheckInClient: fallo al registrar ingreso', err)
        setResult({ error: 'No pudimos registrar el ingreso. Reintentá.' })
      }
    })
  }

  const showNoResults = search.trim() !== '' && !searching && matches.length === 0

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

      {searching && <p className="text-sm text-muted-foreground">Buscando…</p>}

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

      {showNoResults && (
        <p className="text-sm text-muted-foreground">No hay socios que coincidan.</p>
      )}
    </div>
  )
}
