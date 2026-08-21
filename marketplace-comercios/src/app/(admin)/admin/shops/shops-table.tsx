'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Ban, Download, CreditCard, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import {
  bulkApproveShopVerification,
  bulkChangeShopPlan,
  bulkSuspendShops,
} from '@/lib/admin/actions/shops'
import type { getShopsForReview, getSubscriptionPlans } from '@/lib/admin/queries'

type Shop = Awaited<ReturnType<typeof getShopsForReview>>[number]
type Plan = Awaited<ReturnType<typeof getSubscriptionPlans>>[number]

const PAGE_SIZE = 15

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR')
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildCsv(shops: Shop[]) {
  const header = [
    'Comercio',
    'Ciudad',
    'WhatsApp',
    'Registrado',
    'Plan',
    'Productos',
    'Reportes abiertos',
    'Estado',
  ]
  const rows = shops.map((shop) => [
    shop.name,
    shop.city ?? 'Sin ciudad',
    shop.whatsapp_number,
    formatDate(shop.created_at),
    shop.activePlanName ?? 'Free',
    String(shop.productCount),
    String(shop.openReportsCount),
    shop.is_active ? shop.verification_status : `${shop.verification_status} / suspendido`,
  ])

  return [header, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `comercios-export-${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ShopsTable({ shops, plans }: { shops: Shop[]; plans: Plan[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [quickViewShop, setQuickViewShop] = useState<Shop | null>(null)

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return shops
    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) || shop.whatsapp_number.toLowerCase().includes(query)
    )
  }, [shops, search])

  const isPendingTab = filteredShops.every((shop) => shop.verification_status === 'pending')
  const totalPages = Math.max(1, Math.ceil(filteredShops.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageShops = filteredShops.slice(start, start + PAGE_SIZE)

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageShops.map((shop) => shop.id)
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

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

  function handleExportCsv() {
    const selectedShops = shops.filter((shop) => selected.has(shop.id))
    downloadCsv(buildCsv(selectedShops))
  }

  function handleBulkChangePlan() {
    if (!selectedPlanId) return
    startTransition(async () => {
      const { changed, failed } = await bulkChangeShopPlan(selectedIds, selectedPlanId)
      if (changed > 0) {
        toast.add({ title: `${changed} comercios actualizados`, type: 'success' })
      }
      if (failed > 0) {
        toast.add({ title: `${failed} comercios no se pudieron actualizar`, type: 'error' })
      }
      setPlanDialogOpen(false)
      setSelectedPlanId('')
      clear()
    })
  }

  function openQuickView(shop: Shop) {
    setQuickViewShop(shop)
  }

  return (
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder="Buscar por nombre o WhatsApp..."
        aria-label="Buscar comercios"
        className="max-w-sm"
      />

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
              aria-label="Motivo de suspensión"
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
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
            <CreditCard className="size-3.5" aria-hidden />
            Cambiar plan
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Cambiar plan de {selected.size} comercio{selected.size === 1 ? '' : 's'}
              </DialogTitle>
            </DialogHeader>
            <select
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              aria-label="Plan de suscripción"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Seleccioná un plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={isPending || !selectedPlanId} onClick={handleBulkChangePlan}>
                {isPending ? 'Guardando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCsv}>
          <Download className="size-3.5" aria-hidden />
          Exportar CSV
        </Button>
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
            <TableHead>WhatsApp</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Actividad</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageShops.map((shop) => (
            <TableRow
              key={shop.id}
              className="cursor-pointer"
              onClick={() => openQuickView(shop)}
            >
              <TableCell onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={selected.has(shop.id)}
                  onCheckedChange={() => toggle(shop.id)}
                  aria-label={`Seleccionar ${shop.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarImage src={shop.logo_url ?? undefined} alt="" />
                    <AvatarFallback>{getInitials(shop.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{shop.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{shop.city ?? 'Sin ciudad'}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {shop.whatsapp_number}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-muted-foreground tabular-nums">
                {shop.productCount}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <p className="text-xs">{formatRelativeTime(shop.updated_at)}</p>
                <p className="text-[11px] text-muted-foreground">desde {formatDate(shop.created_at)}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {shop.activePlanName ?? (
                  <span className="text-muted-foreground">Free</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  {!shop.is_active && <StatusBadge status="rejected" label="Suspendido" />}
                  <StatusBadge status={shop.verification_status} />
                  {shop.openReportsCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" aria-hidden />
                      {shop.openReportsCount}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
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
        totalCount={filteredShops.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />

      <Sheet open={quickViewShop !== null} onOpenChange={(open) => !open && setQuickViewShop(null)}>
        <SheetContent>
          {quickViewShop && (
            <>
              <SheetHeader>
                <Avatar size="lg" className="mb-2">
                  <AvatarImage src={quickViewShop.logo_url ?? undefined} alt="" />
                  <AvatarFallback>{getInitials(quickViewShop.name)}</AvatarFallback>
                </Avatar>
                <SheetTitle>{quickViewShop.name}</SheetTitle>
                <SheetDescription>Vista rápida del comercio</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-3 px-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Ciudad</span>
                  <span>{quickViewShop.city ?? 'Sin ciudad'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span>{quickViewShop.whatsapp_number}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Registrado</span>
                  <span>{formatDate(quickViewShop.created_at)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Productos</span>
                  <span className="font-mono">{quickViewShop.productCount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Plan</span>
                  <span>{quickViewShop.activePlanName ?? 'Free'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Estado</span>
                  <div className="flex items-center gap-1.5">
                    {!quickViewShop.is_active && <StatusBadge status="rejected" label="Suspendido" />}
                    <StatusBadge status={quickViewShop.verification_status} />
                    {quickViewShop.openReportsCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" aria-hidden />
                        {quickViewShop.openReportsCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <SheetFooter>
                <Button
                  render={<Link href={`/admin/shops/${quickViewShop.id}`} />}
                  nativeButton={false}
                  className="w-full"
                >
                  Ver detalle completo
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
