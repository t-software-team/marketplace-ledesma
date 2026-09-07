'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { createClient } from '@/lib/supabase/client'
import type { GymAccessLogRow, GymAccessOutcome, GymAccessSource } from '@/lib/gym/queries'
import { RenewMemberDialog } from '../socios/renew-member-dialog'

interface PlanOption {
  id: string
  name: string
  price: number
}

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
  plans: PlanOption[]
}

/**
 * Se suscribe a INSERT y UPDATE en gym_check_ins: INSERT para que un ingreso
 * registrado desde la pantalla pública de autoingreso (otro dispositivo, sin
 * recargar acá) aparezca en vivo, y UPDATE porque al renovar una membresía
 * vencida el ingreso de hoy se actualiza in place a 'allowed' (no se inserta
 * uno nuevo) — sin este listener la fila se quedaría mostrando "Vencida".
 */
export function TodayAccessLog({ shopId, initialLog, plans }: TodayAccessLogProps) {
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
                member_id: memberId,
                member_name: member?.full_name ?? null,
                attempted_ref: payload.new.attempted_ref as string | null,
              },
              ...current,
            ].slice(0, LOG_LIMIT)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'gym_check_ins', filter: `shop_id=eq.${shopId}` },
        (payload) => {
          setLog((current) =>
            current.map((row) =>
              row.id === payload.new.id
                ? { ...row, outcome: payload.new.outcome as GymAccessOutcome }
                : row
            )
          )
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
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Origen</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((row) => {
                  const cfg = OUTCOME[row.outcome]
                  const label =
                    row.member_name ?? (row.attempted_ref ? `Nº ${row.attempted_ref}` : 'Desconocido')
                  const canRenew = row.outcome === 'denied_expired' && row.member_id
                  const canCreate = row.outcome === 'denied_not_found'
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="truncate">{label}</span>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {GYM_ACCESS_SOURCE_LABEL[row.source]}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {GYM_ACCESS_SOURCE_LABEL[row.source]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatTime(row.checked_in_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {canRenew && (
                          <RenewMemberDialog memberId={row.member_id as string} plans={plans} />
                        )}
                        {canCreate && (
                          <Button
                            render={
                              <Link
                                href={`/mi-tienda/socios/nuevo${row.attempted_ref ? `?phone=${encodeURIComponent(row.attempted_ref)}` : ''}`}
                              />
                            }
                            nativeButton={false}
                            variant="outline"
                            size="sm"
                          >
                            Dar de alta
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
