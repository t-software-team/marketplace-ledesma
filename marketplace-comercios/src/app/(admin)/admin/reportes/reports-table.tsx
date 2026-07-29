'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
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
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageReports = reports.slice(start, start + PAGE_SIZE)

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
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
