'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import type { getSubscriptionRequests } from '@/lib/admin/queries'
import { SubscriptionActions } from './subscription-actions'
import { GalioPayCheckButton } from './galiopay-check-button'
import { MercadoPagoCheckButton } from './mercadopago-check-button'

type Subscription = Awaited<ReturnType<typeof getSubscriptionRequests>>[number] & {
  proofUrl: string | null
}

const PAGE_SIZE = 10

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

export function SubscriptionsTable({ subscriptions }: { subscriptions: Subscription[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return subscriptions
    return subscriptions.filter(
      (subscription) =>
        (subscription.shops?.name ?? '').toLowerCase().includes(query) ||
        (subscription.subscription_plans?.name ?? '').toLowerCase().includes(query)
    )
  }, [subscriptions, search])

  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageSubscriptions = filteredSubscriptions.slice(start, start + PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder="Buscar por comercio o plan..."
        aria-label="Buscar solicitudes"
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Comercio</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Solicitado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageSubscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell>
                <p className="font-medium">{subscription.shops?.name ?? 'Comercio'}</p>
                {subscription.galiopay_link_id && (
                  <p className="text-xs text-muted-foreground">
                    Pago vía GalioPay — se activa solo al confirmarse
                  </p>
                )}
                {subscription.payment_provider === 'mercadopago' && (
                  <p className="text-xs text-muted-foreground">
                    Pago vía Mercado Pago — se activa solo al confirmarse
                  </p>
                )}
                {subscription.rejection_reason && (
                  <p className="text-xs text-destructive">
                    Motivo: {subscription.rejection_reason}
                  </p>
                )}
                {subscription.proofUrl && (
                  <a
                    href={subscription.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Ver comprobante
                  </a>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {subscription.subscription_plans?.name ?? 'Plan'}
                <br />
                <span className="font-mono text-xs text-muted-foreground">
                  {formatMoney(subscription.subscription_plans?.price ?? 0)}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(subscription.created_at).toLocaleDateString('es-AR')}
              </TableCell>
              <TableCell>
                <StatusBadge status={subscription.status} />
              </TableCell>
              <TableCell className="text-right">
                {subscription.status === 'pending' && subscription.galiopay_link_id ? (
                  <GalioPayCheckButton
                    subscriptionId={subscription.id}
                    linkId={subscription.galiopay_link_id}
                    proofToken={subscription.galiopay_proof_token ?? ''}
                  />
                ) : subscription.status === 'pending' &&
                  subscription.payment_provider === 'mercadopago' &&
                  subscription.mercadopago_reference_id ? (
                  <MercadoPagoCheckButton referenceId={subscription.mercadopago_reference_id} />
                ) : (
                  subscription.status === 'pending' && (
                    <SubscriptionActions subscriptionId={subscription.id} />
                  )
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={filteredSubscriptions.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
