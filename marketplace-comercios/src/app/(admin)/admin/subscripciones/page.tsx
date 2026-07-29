import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import {
  getSignedPaymentProofUrl,
  getSubscriptionPlans,
  getSubscriptionRequests,
} from '@/lib/admin/queries'
import { SubscriptionsTable } from './subscriptions-table'
import { PlansTable } from './plans-table'

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
            <SubscriptionsTable subscriptions={withProofUrls} />
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
            <PlansTable plans={plans} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
