'use client'

import { useEffect, useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { checkInGymMember, searchGymMembers } from '@/lib/gym/actions'
import type { GymMemberSearchResult } from '@/lib/gym/queries'

type View = 'form' | 'success' | 'warning' | 'error'

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
  const [view, setView] = useState<View>('form')
  const [lastResult, setLastResult] = useState<{
    member_name: string
    status: string
    expires_at: string | null
    error?: string
  } | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const viewConfig = {
    success: {
      bg: 'bg-green-500',
      icon: CheckCircle2,
      title: 'Ingreso registrado',
      subtitle: lastResult ? `Membresía vigente hasta ${formatDate(lastResult.expires_at)}.` : '',
    },
    warning: {
      bg: 'bg-amber-500',
      icon: AlertTriangle,
      title: 'Ingreso registrado',
      subtitle: lastResult?.error || 'Membresía vencida. Conviene renovar.',
    },
    error: {
      bg: 'bg-red-500',
      icon: XCircle,
      title: 'No se pudo registrar',
      subtitle: lastResult?.error || 'Reintentá en un momento.',
    },
  } as const

  // Debounced server-side search. Empty query is handled in the input's
  // onChange (not here) to avoid calling setState synchronously in the effect
  // body for that case.
  useEffect(() => {
    const q = search.trim()
    if (!q) return

    let ignore = false
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
    }, 150)

    return () => {
      ignore = true
      clearTimeout(handle)
    }
  }, [search])

  const resetToForm = () => {
    setView('form')
    setLastResult(null)
    setSearch('')
    setMatches([])
  }

  // Auto-reset after success/warning/error
  useEffect(() => {
    if (view === 'form') {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    timerRef.current = setTimeout(() => {
      resetToForm()
    }, 4000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [view])

  // Sonido corto de éxito con Web Audio API
  useEffect(() => {
    if (view !== 'success') return

    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextCtor) return

      const ctx = new AudioContextCtor()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (err) {
      console.error('CheckInClient: fallo al reproducir sonido de éxito', err)
    }
  }, [view])

  const register = (member: GymMemberSearchResult) => {
    startTransition(async () => {
      try {
        const res = await checkInGymMember(member.id)
        if (res.error) {
          setLastResult({ member_name: res.member_name ?? member.full_name, status: 'error', expires_at: null, error: res.error })
          setView('error')
          toast.add({ title: 'No pudimos registrar el ingreso', description: res.error, type: 'error' })
          return
        }
        if (res.status === 'active') {
          setLastResult({ member_name: res.member_name!, status: 'active', expires_at: res.expires_at ?? null })
          setView('success')
        } else {
          setLastResult({ member_name: res.member_name!, status: 'expired', expires_at: res.expires_at ?? null })
          setView('warning')
        }
        setSearch('')
        setMatches([])
        router.refresh()
      } catch (err) {
        console.error('CheckInClient: fallo al registrar ingreso', err)
        setLastResult({ member_name: 'Error', status: 'error', expires_at: null, error: 'Reintentá en un momento.' })
        setView('error')
        toast.add({
          title: 'No pudimos registrar el ingreso',
          description: 'Reintentá en un momento.',
          type: 'error',
        })
      }
    })
  }

  // Enter registra si hay 1 solo match
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && matches.length === 1 && !isPending) {
      register(matches[0])
    }
  }

  const showNoResults = search.trim() !== '' && !searching && matches.length === 0

  const currentView = view === 'form' ? null : viewConfig[view === 'error' ? 'error' : view === 'warning' ? 'warning' : 'success']

  return (
    <div className="space-y-3">
      {view === 'form' ? (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => {
                const value = e.target.value
                setSearch(value)
                if (value.trim()) {
                  setSearching(true)
                } else {
                  setMatches([])
                  setSearching(false)
                }
              }}
              onKeyDown={handleKeyDown}
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
        </>
      ) : (
        <div className={`flex flex-col items-center justify-center gap-4 rounded-xl py-10 text-white ${currentView?.bg ?? 'bg-green-500'}`}>
          {lastResult && (() => {
            const config = currentView!
            const Icon = config.icon
            return (
              <>
                <Icon className="size-16 shrink-0" aria-hidden />
                <p className="text-center text-xl font-semibold">{config.title}</p>
                {lastResult.member_name && (
                  <p className="text-center text-2xl font-bold">{lastResult.member_name}</p>
                )}
                {config.subtitle && (
                  <p className="text-center text-base opacity-90">{config.subtitle}</p>
                )}
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-2"
                  onClick={resetToForm}
                  disabled={isPending}
                >
                  <RotateCcw className="mr-2 size-4" aria-hidden />
                  Registrar otro
                </Button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
