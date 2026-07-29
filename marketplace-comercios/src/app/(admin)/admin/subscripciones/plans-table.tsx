'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import type { getSubscriptionPlans } from '@/lib/admin/queries'
import { PlanRowActions } from './plan-row-actions'

type Plan = Awaited<ReturnType<typeof getSubscriptionPlans>>[number]

const PAGE_SIZE = 10

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

export function PlansTable({ plans }: { plans: Plan[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(plans.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pagePlans = plans.slice(start, start + PAGE_SIZE)

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagePlans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell className="font-mono">{formatMoney(plan.price)}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {plan.duration_days} días
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={plan.is_active ? 'active' : 'none'}
                  label={plan.is_active ? 'Activo' : 'Inactivo'}
                />
              </TableCell>
              <TableCell className="text-right">
                <PlanRowActions planId={plan.id} isActive={plan.is_active} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={plans.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
