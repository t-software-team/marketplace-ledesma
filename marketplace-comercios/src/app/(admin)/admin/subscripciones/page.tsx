import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
            <div className="space-y-3">
              {withProofUrls.map((subscription) => (
                <Card key={subscription.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate font-medium">
                        {subscription.shops?.name ?? 'Comercio'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.subscription_plans?.name ?? 'Plan'} ·{' '}
                        <span className="font-mono">
                          {formatMoney(subscription.subscription_plans?.price ?? 0)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Solicitado el {new Date(subscription.created_at).toLocaleDateString('es-AR')}
                      </p>
                      {subscription.proofUrl && (
                        <a
                          href={subscription.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline"
                        >
                          Ver comprobante
                        </a>
                      )}
                      {subscription.rejection_reason && (
                        <p className="text-xs text-destructive">
                          Motivo: {subscription.rejection_reason}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={subscription.status} />
                    {subscription.status === 'pending' && (
                      <SubscriptionActions subscriptionId={subscription.id} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
            <div className="space-y-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-mono">{formatMoney(plan.price)}</span> · {plan.duration_days} días
                      </p>
                      <StatusBadge status={plan.is_active ? 'active' : 'none'} label={plan.is_active ? 'Activo' : 'Inactivo'} />
                    </div>
                    <PlanRowActions planId={plan.id} isActive={plan.is_active} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
