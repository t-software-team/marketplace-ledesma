'use client'

import { useState } from 'react'
import { CalendarClock, CalendarCheck, ChevronDown, PercentCircle, UserX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TrendAreaChart } from '@/components/shared/trend-area-chart'
import { cn } from '@/lib/utils'
import type { AppointmentStats } from '@/lib/turnos/queries'

interface TurnosStatsProps {
  stats: AppointmentStats
}

export function TurnosStats({ stats }: TurnosStatsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl ring-1 ring-foreground/10">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors hover:text-foreground">
        <span>Reportes de turnos</span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 border-t border-border p-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
                <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                <p className="truncate text-xs text-muted-foreground">Pendientes</p>
                <p className="text-xl font-heading font-mono sm:text-2xl">{stats.pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
                <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
                <p className="truncate text-xs text-muted-foreground">Confirmados próximos</p>
                <p className="text-xl font-heading font-mono sm:text-2xl">{stats.upcomingConfirmedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
                <PercentCircle className="size-4 text-muted-foreground" aria-hidden />
                <p className="truncate text-xs text-muted-foreground">Tasa de confirmación</p>
                <p className="text-xl font-heading font-mono sm:text-2xl">
                  {stats.confirmationRate === null ? '—' : `${stats.confirmationRate}%`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
                <UserX className="size-4 text-muted-foreground" aria-hidden />
                <p className="truncate text-xs text-muted-foreground">No-show</p>
                <p className="text-xl font-heading font-mono sm:text-2xl">
                  {stats.noShowRate === null ? '—' : `${stats.noShowRate}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Turnos solicitados</p>
                  <p className="text-xs text-muted-foreground">Últimos 14 días</p>
                </div>
                <p className="font-mono text-lg font-semibold text-primary">
                  {stats.requestedLast30}{' '}
                  <span className="text-xs font-normal text-muted-foreground">en 30 días</span>
                </p>
              </div>
              <TrendAreaChart data={stats.series} dataKey="turnos" label="Turnos" gradientId="turnosSeries" />
            </CardContent>
          </Card>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
