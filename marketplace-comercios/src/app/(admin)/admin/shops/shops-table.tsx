'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import type { getShopsForReview } from '@/lib/admin/queries'

type Shop = Awaited<ReturnType<typeof getShopsForReview>>[number]

const PAGE_SIZE = 15

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR')
}

export function ShopsTable({ shops }: { shops: Shop[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(shops.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageShops = shops.slice(start, start + PAGE_SIZE)

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Comercio</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageShops.map((shop) => (
            <TableRow key={shop.id}>
              <TableCell className="font-medium">{shop.name}</TableCell>
              <TableCell className="text-muted-foreground">{shop.city ?? 'Sin ciudad'}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {shop.whatsapp_number}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(shop.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {!shop.is_active && <StatusBadge status="rejected" label="Suspendido" />}
                  <StatusBadge status={shop.verification_status} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  render={<Link href={`/admin/shops/${shop.id}`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  Ver detalle
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={shops.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
