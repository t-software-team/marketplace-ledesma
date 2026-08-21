'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import { bulkDismissReports, bulkMarkReportsReviewed } from '@/lib/admin/actions/reports'
import type { getShopReports } from '@/lib/admin/queries'
import type { Database } from '@/types/database.types'
import { ReportActions } from './report-actions'

type Report = Awaited<ReturnType<typeof getShopReports>>[number]
type ReportReason = Database['public']['Enums']['report_reason']

const REASON_LABEL: Record<ReportReason, string> = {
  fake_product: 'Producto falso',
  scam: 'Estafa',
  inappropriate: 'Contenido inapropiado',
  closed_permanently: 'Cerrado permanentemente',
  other: 'Otro',
}

const PAGE_SIZE = 10

export function ReportsTable({ reports }: { reports: Report[] }) {
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const isPendingTab = reports.every((report) => report.status === 'pending')
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageReports = reports.slice(start, start + PAGE_SIZE)

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageReports.map((report) => report.id)
  )

  function handleBulkReview() {
    startTransition(async () => {
      try {
        await bulkMarkReportsReviewed(selectedIds)
        toast.add({ title: `${selectedIds.length} reportes marcados como revisados`, type: 'success' })
        clear()
      } catch {
        toast.add({ title: 'No pudimos actualizar los reportes', type: 'error' })
      }
    })
  }

  function handleBulkDismiss() {
    startTransition(async () => {
      try {
        await bulkDismissReports(selectedIds)
        toast.add({ title: `${selectedIds.length} reportes descartados`, type: 'success' })
        clear()
      } catch {
        toast.add({ title: 'No pudimos descartar los reportes', type: 'error' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {isPendingTab && (
        <BulkActionsBar count={selected.size} onClear={clear}>
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleBulkReview}>
            Marcar revisado
          </Button>
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleBulkDismiss}>
            Descartar
          </Button>
        </BulkActionsBar>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {isPendingTab && (
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Seleccionar todos los reportes de esta página"
                />
              </TableHead>
            )}
            <TableHead>Comercio</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Reportado por</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageReports.map((report) => {
            const reporterName = report.reported_by_profile?.full_name ?? 'Anónimo'
            return (
              <TableRow key={report.id}>
                {isPendingTab && (
                  <TableCell>
                    <Checkbox
                      checked={selected.has(report.id)}
                      onCheckedChange={() => toggle(report.id)}
                      aria-label={`Seleccionar reporte de ${report.shops?.name ?? 'comercio'}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{report.shops?.name ?? 'Comercio'}</TableCell>
                <TableCell>
                  {REASON_LABEL[report.reason]}
                  {report.comment && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                      {report.comment}
                    </p>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {reporterName}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell>
                  <StatusBadge status={report.status} />
                </TableCell>
                <TableCell className="text-right">
                  {report.status === 'pending' && <ReportActions reportId={report.id} />}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={reports.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
