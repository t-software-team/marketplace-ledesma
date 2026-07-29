'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { getAuditLog } from '@/lib/admin/queries'

type AuditEntry = Awaited<ReturnType<typeof getAuditLog>>[number]

const ACTION_LABEL: Record<string, string> = {
  shop_verified: 'Comercio verificado',
  shop_verification_rejected: 'Verificación rechazada',
  subscription_approved: 'Suscripción aprobada',
  subscription_rejected: 'Suscripción rechazada',
  report_reviewed: 'Reporte revisado',
  report_dismissed: 'Reporte descartado',
}

const ACTION_VARIANT: Record<string, 'success' | 'destructive' | 'warning'> = {
  shop_verified: 'success',
  shop_verification_rejected: 'destructive',
  subscription_approved: 'success',
  subscription_rejected: 'destructive',
  report_reviewed: 'success',
  report_dismissed: 'warning',
}

const PAGE_SIZE = 15

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageEntries = entries.slice(start, start + PAGE_SIZE)

  return (
    <div className="space-y-3">
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
                {entry.target_table} · {entry.target_id}
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
        totalCount={entries.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
