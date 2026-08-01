'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { getAuditLog } from '@/lib/admin/queries'

type AuditEntry = Awaited<ReturnType<typeof getAuditLog>>[number]

// Maps target_table values to real, existing admin detail routes.
// Only add entries here for routes confirmed to exist in src/app/(admin)/admin/.
const TARGET_ROUTE_BUILDERS: Record<string, (targetId: string) => string> = {
  shops: (targetId) => `/admin/shops/${targetId}`,
}

const ALL_ACTIONS_VALUE = 'all'

const ACTION_LABEL: Record<string, string> = {
  shop_verified: 'Comercio verificado',
  shop_verification_rejected: 'Verificación rechazada',
  subscription_approved: 'Suscripción aprobada',
  subscription_rejected: 'Suscripción rechazada',
  report_reviewed: 'Reporte revisado',
  report_dismissed: 'Reporte descartado',
  shop_plan_changed: 'Plan del comercio cambiado',
  category_suggestion_approved: 'Categoría sugerida aprobada',
  category_suggestion_rejected: 'Categoría sugerida rechazada',
}

const ACTION_VARIANT: Record<string, 'success' | 'destructive' | 'warning'> = {
  shop_verified: 'success',
  shop_verification_rejected: 'destructive',
  subscription_approved: 'success',
  subscription_rejected: 'destructive',
  report_reviewed: 'success',
  report_dismissed: 'warning',
  shop_plan_changed: 'success',
  category_suggestion_approved: 'success',
  category_suggestion_rejected: 'destructive',
}

const PAGE_SIZE = 15

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState(ALL_ACTIONS_VALUE)
  const [actorFilter, setActorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const availableActions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.action))),
    [entries]
  )

  const filteredEntries = useMemo(() => {
    const actorQuery = actorFilter.trim().toLowerCase()
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null
    const toTime = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null

    return entries.filter((entry) => {
      if (actionFilter !== ALL_ACTIONS_VALUE && entry.action !== actionFilter) {
        return false
      }

      if (actorQuery && !(entry.actor?.full_name ?? '').toLowerCase().includes(actorQuery)) {
        return false
      }

      const entryTime = new Date(entry.created_at).getTime()
      if (fromTime !== null && entryTime < fromTime) {
        return false
      }
      if (toTime !== null && entryTime > toTime) {
        return false
      }

      return true
    })
  }, [entries, actionFilter, actorFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageEntries = filteredEntries.slice(start, start + PAGE_SIZE)

  function handleActionFilterChange(value: string | null) {
    setActionFilter(value ?? ALL_ACTIONS_VALUE)
    setPage(1)
  }

  function handleActorFilterChange(value: string) {
    setActorFilter(value)
    setPage(1)
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value)
    setPage(1)
  }

  function handleDateToChange(value: string) {
    setDateTo(value)
    setPage(1)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-action-filter" className="text-xs text-muted-foreground">
            Acción
          </label>
          <Select value={actionFilter} onValueChange={handleActionFilterChange}>
            <SelectTrigger id="audit-action-filter" className="w-48">
              <SelectValue placeholder="Todas las acciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ACTIONS_VALUE}>Todas las acciones</SelectItem>
              {availableActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {ACTION_LABEL[action] ?? action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="audit-actor-filter" className="text-xs text-muted-foreground">
            Actor
          </label>
          <Input
            id="audit-actor-filter"
            placeholder="Buscar por actor..."
            value={actorFilter}
            onChange={(event) => handleActorFilterChange(event.target.value)}
            className="w-48"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="audit-date-from" className="text-xs text-muted-foreground">
            Desde
          </label>
          <Input
            id="audit-date-from"
            type="date"
            value={dateFrom}
            onChange={(event) => handleDateFromChange(event.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="audit-date-to" className="text-xs text-muted-foreground">
            Hasta
          </label>
          <Input
            id="audit-date-to"
            type="date"
            value={dateTo}
            onChange={(event) => handleDateToChange(event.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acción</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead className="text-right">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageEntries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <Badge variant={ACTION_VARIANT[entry.action] ?? 'outline'}>
                  {ACTION_LABEL[entry.action] ?? entry.action}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {entry.actor?.full_name ?? 'Usuario desconocido'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {(() => {
                  const buildRoute = TARGET_ROUTE_BUILDERS[entry.target_table]
                  if (buildRoute && entry.target_id) {
                    return (
                      <Link href={buildRoute(entry.target_id)} className="text-primary hover:underline">
                        {entry.target_table} · {entry.target_id}
                      </Link>
                    )
                  }
                  return (
                    <span>
                      {entry.target_table} · {entry.target_id}
                    </span>
                  )
                })()}
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                {entry.metadata != null ? JSON.stringify(entry.metadata) : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString('es-AR')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={filteredEntries.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
