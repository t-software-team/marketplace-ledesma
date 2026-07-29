import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  getSignedPaymentProofUrl,
  getSubscriptionPlans,
  getSubscriptionRequests,
} from '@/lib/admin/queries'
import { SubscriptionActions } from './subscription-actions'
import { PlanRowActions } from './plan-row-actions'
import { GalioPayCheckButton } from './galiopay-check-button'

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

export default async function AdminSubscriptionsPage() {
  const [subscriptions, plans] = await Promise.all([
    getSubscriptionRequests(),
    getSubscriptionPlans(),
  ])

  const withProofUrls = await Promise.all(
    subscriptions.map(async (subscription) => ({
      ...subscription,
      proofUrl: subscription.payment_proof_url
        ? await getSignedPaymentProofUrl(subscription.payment_proof_url)
        : null,
    }))
  )

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <div>
        <h1 className="text-2xl font-heading">Suscripciones</h1>
        <p className="text-sm text-muted-foreground">
          Aprobación de solicitudes de plan pago
        </p>
      </div>

      <Tabs defaultValue="solicitudes">
        <TabsList>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes" className="space-y-3 pt-2">
          {withProofUrls.length === 0 ? (
            <EmptyState message="No hay solicitudes de suscripción." />
          ) : (
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
                {withProofUrls.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <p className="font-medium">{subscription.shops?.name ?? 'Comercio'}</p>
                      {subscription.galiopay_link_id && (
                        <p className="text-xs text-muted-foreground">
                          Pago vía GalioPay — se activa solo al confirmarse
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
          )}
        </TabsContent>

        <TabsContent value="planes" className="space-y-3 pt-2">
          <div className="flex justify-end">
            <Button render={<Link href="/admin/subscripciones/planes/nueva" />} nativeButton={false}>
              Nuevo plan
            </Button>
          </div>

          {plans.length === 0 ? (
            <EmptyState illustration={<EmptyBoxIllustration />} message="Todavía no hay planes." />
          ) : (
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
                {plans.map((plan) => (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
