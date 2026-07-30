'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import { bulkApproveShopVerification, bulkSuspendShops } from '@/lib/admin/actions'
import type { getShopsForReview } from '@/lib/admin/queries'

type Shop = Awaited<ReturnType<typeof getShopsForReview>>[number]

const PAGE_SIZE = 15

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR')
}

export function ShopsTable({ shops }: { shops: Shop[] }) {
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reason, setReason] = useState('')
  const isPendingTab = shops.every((shop) => shop.verification_status === 'pending')
  const totalPages = Math.max(1, Math.ceil(shops.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageShops = shops.slice(start, start + PAGE_SIZE)

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageShops.map((shop) => shop.id)
  )

  function handleBulkApprove() {
    startTransition(async () => {
      const { approved, failed } = await bulkApproveShopVerification(selectedIds)
      if (approved > 0) {
        toast.add({ title: `${approved} comercios verificados`, type: 'success' })
      }
      if (failed > 0) {
        toast.add({ title: `${failed} comercios no se pudieron verificar`, type: 'error' })
      }
      clear()
    })
  }

  function handleBulkSuspend() {
    startTransition(async () => {
      const { suspended, failed } = await bulkSuspendShops(selectedIds, reason)
      if (suspended > 0) {
        toast.add({ title: `${suspended} comercios suspendidos`, type: 'success' })
      }
      if (failed > 0) {
        toast.add({ title: `${failed} comercios no se pudieron suspender`, type: 'error' })
      }
      setSuspendOpen(false)
      setReason('')
      clear()
    })
  }

  return (
    <div className="space-y-3">
      <BulkActionsBar count={selected.size} onClear={clear}>
        {isPendingTab && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleBulkApprove}>
            Verificar
          </Button>
        )}
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-destructive" />}>
            <Ban className="size-3.5" aria-hidden />
            Suspender
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Suspender {selected.size} comercio{selected.size === 1 ? '' : 's'}
              </DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Motivo de la suspensión"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={isPending || reason.trim().length < 5}
                onClick={handleBulkSuspend}
              >
                {isPending ? 'Suspendiendo...' : 'Suspender'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </BulkActionsBar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todos los comercios de esta página"
              />
            </TableHead>
            <TableHead>Comercio</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageShops.map((shop) => (
            <TableRow key={shop.id}>
              <TableCell>
                <Checkbox
                  checked={selected.has(shop.id)}
                  onCheckedChange={() => toggle(shop.id)}
                  aria-label={`Seleccionar ${shop.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">{shop.name}</TableCell>
              <TableCell className="text-muted-foreground">{shop.city ?? 'Sin ciudad'}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {shop.whatsapp_number}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(shop.created_at)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {shop.activePlanName ?? (
                  <span className="text-muted-foreground">Free</span>
                )}
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
