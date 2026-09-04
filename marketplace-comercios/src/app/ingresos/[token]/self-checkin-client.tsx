'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, UserX, Users, Clock, WifiOff } from 'lucide-react'
import { NumberPad } from '@/components/ui/number-pad'
import { InstallAppButton } from '@/components/shared/install-app-button'
import { useGymOfflineCheckin } from '@/hooks/use-gym-offline-checkin'
import { useGymCheckinSound } from '@/hooks/use-gym-checkin-sound'
import { gymSelfCheckin, type SelfCheckinResult } from '@/lib/gym/self-checkin-actions'

// A check-in resolved from the on-device cache while offline. The real
// outcome (active/expired/already) is decided later, server-side, once the
// device syncs — this status only means "we wrote it down, hang tight".
type OfflinePendingResult = { status: 'offline_pending'; firstName: string }
type ViewResult = SelfCheckinResult | OfflinePendingResult

type View = 'form' | ViewResult['status']
type Mode = 'partial' | 'full'

const RESET_MS = 4000

export function SelfCheckinClient({ token, gymName }: { token: string; gymName: string }) {
  const [value, setValue] = useState('')
  const [mode, setMode] = useState<Mode>('partial')
  const [view, setView] = useState<View>('form')
  const [result, setResult] = useState<ViewResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const { isOnline, pendingCount, matchLocal, enqueue } = useGymOfflineCheckin(token)
  const { playSuccessSound, playDangerSound } = useGymCheckinSound()

  const reset = useCallback(() => {
    setView('form')
    setResult(null)
    setValue('')
    setMode('partial')
  }, [])

  // Auto-return to the form after showing any result.
  useEffect(() => {
    if (view === 'form') return
    const handle = setTimeout(reset, RESET_MS)
    return () => clearTimeout(handle)
  }, [view, reset])

  useEffect(() => {
    if (view === 'active') playSuccessSound()
    if (view === 'expired' || view === 'not_found') playDangerSound()
  }, [view, playSuccessSound, playDangerSound])

  const maxLen = mode === 'partial' ? 4 : 15
  const minLen = mode === 'partial' ? 4 : 6

  const submit = () => {
    const clean = value.replace(/\D/g, '')
    if (clean.length < minLen || isPending) return

    startTransition(async () => {
      try {
        const res = await gymSelfCheckin(token, clean, mode)
        // Several members share these 4 digits: ask for the full number.
        if (res.status === 'ambiguous' && mode === 'partial') {
          setMode('full')
          setValue('')
          return
        }
        setResult(res)
        setView(res.status)
      } catch (err) {
        // gymSelfCheckin never throws for a business outcome (denied, not
        // found, etc.) — it always resolves. A throw here means the request
        // itself never reached the server, i.e. we're offline. Fall back to
        // the on-device roster cache instead of failing the tap outright.
        console.error('SelfCheckinClient: sin conexión, resolviendo con el padrón local', err)
        const local = matchLocal(clean)
        if (local.kind === 'not_found') {
          setResult({ status: 'not_found' })
          setView('not_found')
          return
        }
        if (local.kind === 'ambiguous') {
          if (mode === 'partial') {
            setMode('full')
            setValue('')
            return
          }
          setResult({ status: 'ambiguous' })
          setView('ambiguous')
          return
        }
        await enqueue(clean)
        setResult({ status: 'offline_pending', firstName: local.firstName })
        setView('offline_pending')
      }
    })
  }

  if (view === 'form') {
    return (
      <main className="dark flex min-h-dvh flex-col items-center justify-center gap-7 bg-background px-6 py-8 text-foreground">
        {!isOnline && (
          <div className="fixed top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground ring-1 ring-border">
            <WifiOff className="size-3.5" aria-hidden />
            Sin conexión{pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}` : ''}
          </div>
        )}

        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Autoingreso</p>
          <h1 className="mt-1.5 font-heading text-3xl font-semibold sm:text-4xl">{gymName}</h1>
          <p className="mx-auto mt-3 max-w-xs text-base text-muted-foreground sm:text-lg">
            {mode === 'partial'
              ? 'Ingresá los últimos 4 dígitos de tu celular'
              : 'Hay más de un socio con esos dígitos. Ingresá tu número completo.'}
          </p>
        </header>

        {mode === 'partial' ? (
          <div className="flex gap-3" aria-label="Últimos 4 dígitos del celular" aria-live="polite">
            {Array.from({ length: 4 }).map((_, i) => {
              const char = value[i]
              const active = i === value.length
              return (
                <div
                  key={i}
                  className={`flex h-16 w-14 items-center justify-center rounded-xl bg-surface font-mono text-4xl font-semibold text-foreground ring-1 sm:h-20 sm:w-16 ${
                    active ? 'ring-2 ring-primary' : 'ring-border'
                  }`}
                >
                  {char ?? <span className="text-muted-foreground/30">·</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="flex h-16 min-w-[13rem] items-center justify-center rounded-xl bg-surface px-6 font-mono text-3xl font-semibold tracking-wider text-foreground ring-1 ring-border sm:h-20"
            aria-live="polite"
          >
            {value || <span className="text-muted-foreground/50">número</span>}
          </div>
        )}

        <NumberPad
          value={value}
          onChange={setValue}
          onSubmit={submit}
          maxLength={maxLen}
          disabled={isPending}
          submitDisabled={value.length < minLen}
        />

        <p className="h-5 text-sm text-muted-foreground" aria-live="polite">
          {isPending ? 'Registrando…' : ''}
        </p>

        {/* One-time setup by gym staff: pins this screen to the tablet's home
            screen. Self-hides once installed. */}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2">
          <InstallAppButton label="Instalar en esta tablet" />
        </div>
      </main>
    )
  }

  return <ResultScreen result={result} />
}

const RESULT_CONFIG = {
  active: {
    bg: 'bg-green-500',
    Icon: CheckCircle2,
    title: () => '¡Bienvenido/a!',
    subtitle: () => 'Ingreso registrado. ¡A entrenar!',
  },
  already: {
    bg: 'bg-amber-500',
    Icon: Clock,
    title: () => 'Ya ingresaste hoy',
    subtitle: () => 'Tu entrada de hoy ya estaba registrada.',
  },
  expired: {
    bg: 'bg-amber-500',
    Icon: AlertTriangle,
    title: () => 'Ingreso no permitido',
    subtitle: () => 'Tu membresía está vencida. Pasá por recepción para renovar.',
  },
  not_found: {
    bg: 'bg-red-500',
    Icon: UserX,
    title: () => 'No te encontramos',
    subtitle: () => 'Revisá el número o pasá por recepción.',
  },
  ambiguous: {
    bg: 'bg-amber-500',
    Icon: Users,
    title: () => 'Necesitamos una mano',
    subtitle: () => 'Hay varios socios con ese número. Acercate a recepción.',
  },
  error: {
    bg: 'bg-red-500',
    Icon: XCircle,
    title: () => 'Ups',
    subtitle: () => 'Reintentá en un momento.',
  },
  offline_pending: {
    bg: 'bg-sky-600',
    Icon: WifiOff,
    title: () => 'Ingreso guardado',
    subtitle: () => 'Sin conexión — se confirmará apenas vuelva internet.',
  },
} as const

function ResultScreen({ result }: { result: ViewResult | null }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  if (!result) return null
  const config = RESULT_CONFIG[result.status]
  const { Icon } = config
  const name =
    result.status === 'active' ||
    result.status === 'already' ||
    result.status === 'expired' ||
    result.status === 'offline_pending'
      ? result.firstName
      : null

  return (
    <main
      className={`flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-10 text-center text-white ${config.bg}`}
    >
      <div className={`relative transition-all duration-500 ${entered ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        {result.status === 'active' && (
          <span className="absolute inset-0 animate-ping rounded-full bg-white/40" aria-hidden />
        )}
        <Icon className="relative size-28 sm:size-36" aria-hidden />
      </div>

      {name && <p className="text-4xl font-bold sm:text-5xl">{name}</p>}
      <p className="text-2xl font-semibold sm:text-3xl">{config.title()}</p>
      <p className="max-w-md text-lg text-white/90 sm:text-xl">{config.subtitle()}</p>
    </main>
  )
}
