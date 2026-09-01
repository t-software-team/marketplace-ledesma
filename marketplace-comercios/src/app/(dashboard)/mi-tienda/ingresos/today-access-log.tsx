'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { GymAccessLogRow, GymAccessOutcome, GymAccessSource } from '@/lib/gym/queries'

const LOG_LIMIT = 200

const GYM_ACCESS_SOURCE_LABEL: Record<GymAccessSource, string> = {
  desk: 'Mostrador',
  self: 'Autoingreso',
  self_offline: 'Autoingreso (offline)',
}

const OUTCOME: Record<
  GymAccessOutcome,
  { label: string; variant: 'success' | 'warning' | 'outline' }
> = {
  allowed: { label: 'Ingresó', variant: 'success' },
  denied_expired: { label: 'Vencida', variant: 'warning' },
  denied_not_found: { label: 'No encontrado', variant: 'outline' },
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

interface TodayAccessLogProps {
  shopId: string
  initialLog: GymAccessLogRow[]
}

/**
 * Se suscribe a INSERT en gym_check_ins para que un ingreso registrado desde
 * la pantalla pública de autoingreso (otro dispositivo, sin recargar acá)
 * aparezca en vivo, no solo los que dispara el propio mostrador.
 */
export function TodayAccessLog({ shopId, initialLog }: TodayAccessLogProps) {
  const [log, setLog] = useState(initialLog)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`gym-check-ins-${shopId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gym_check_ins', filter: `shop_id=eq.${shopId}` },
        async (payload) => {
          const memberId = payload.new.member_id as string | null
          const { data: member } = memberId
            ? await supabase.from('gym_members').select('full_name').eq('id', memberId).maybeSingle()
            : { data: null }

          setLog((current) => {
            if (current.some((row) => row.id === payload.new.id)) return current
            return [
              {
                id: payload.new.id as string,
                checked_in_at: payload.new.checked_in_at as string,
                outcome: payload.new.outcome as GymAccessOutcome,
                source: payload.new.source as GymAccessSource,
                member_name: member?.full_name ?? null,
                attempted_ref: payload.new.attempted_ref as string | null,
              },
              ...current,
            ].slice(0, LOG_LIMIT)
          })
        }
      )
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'))

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [shopId])

  const allowed = log.filter((r) => r.outcome === 'allowed').length
  const deniedExpired = log.filter((r) => r.outcome === 'denied_expired').length
  const deniedNotFound = log.filter((r) => r.outcome === 'denied_not_found').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Actividad de hoy</CardTitle>
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${isLive ? 'bg-success' : 'bg-muted-foreground'}`}
              aria-hidden
            />
            <span className="text-xs text-muted-foreground">{isLive ? 'En vivo' : 'Conectando...'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
          <span>{allowed} ingresos</span>
          {deniedExpired > 0 && <span>· {deniedExpired} denegados por vencida</span>}
          {deniedNotFound > 0 && <span>· {deniedNotFound} sin socio</span>}
        </div>
      </CardHeader>
      <CardContent>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hubo actividad hoy.</p>
        ) : (
          <div className="space-y-1">
            {log.map((row) => {
              const cfg = OUTCOME[row.outcome]
              const label = row.member_name ?? (row.attempted_ref ? `Nº ${row.attempted_ref}` : 'Desconocido')
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm last:border-0 animate-in fade-in-0 slide-in-from-top-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <span className="truncate">{label}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span>{GYM_ACCESS_SOURCE_LABEL[row.source].toLowerCase()}</span>
                    <span className="font-mono">{formatTime(row.checked_in_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
