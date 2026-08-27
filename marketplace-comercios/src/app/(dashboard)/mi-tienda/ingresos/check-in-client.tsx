'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { checkInGymMember, searchGymMembers } from '@/lib/gym/actions'
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

  const register = (member: GymMemberSearchResult) => {
    startTransition(async () => {
      try {
        const res = await checkInGymMember(member.id)
        if (res.error) {
          toast.add({ title: 'No pudimos registrar el ingreso', description: res.error, type: 'error' })
          return
        }
        if (res.status === 'active') {
          toast.add({
            title: `Ingreso registrado — ${res.member_name}`,
            description: `Membresía vigente hasta ${formatDate(res.expires_at)}.`,
            type: 'success',
          })
        } else {
          toast.add({
            title: `Ingreso registrado — ${res.member_name}`,
            description: 'Membresía vencida. Conviene renovar.',
            type: 'warning',
          })
        }
        setSearch('')
        setMatches([])
        router.refresh()
      } catch (err) {
        console.error('CheckInClient: fallo al registrar ingreso', err)
        toast.add({
          title: 'No pudimos registrar el ingreso',
          description: 'Reintentá en un momento.',
          type: 'error',
        })
      }
    })
  }

  const showNoResults = search.trim() !== '' && !searching && matches.length === 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar socio por nombre o DNI…"
          aria-label="Buscar socio por nombre o DNI"
          className="h-11 pl-9 text-base"
          autoFocus
        />
      </div>

      {searching && <p className="px-1 text-sm text-muted-foreground">Buscando…</p>}

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((m) => {
            const vigente = m.status === 'active'
            return (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.document ? `DNI ${m.document} · ` : ''}
                    Vence {formatDate(m.expires_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={vigente ? 'success' : 'warning'}>
                    {vigente ? 'Vigente' : 'Vencida'}
                  </Badge>
                  <Button size="sm" disabled={isPending} onClick={() => register(m)}>
                    Registrar ingreso
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNoResults && (
        <p className="px-1 text-sm text-muted-foreground">No hay socios que coincidan.</p>
      )}
    </div>
  )
}
