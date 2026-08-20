import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { getSignedPaymentProofUrl, getSubscriptionRequests } from '@/lib/admin/queries'
import { SubscriptionsTable } from './subscriptions-table'

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getSubscriptionRequests()

  const withProofUrls = await Promise.all(
    subscriptions.map(async (subscription) => ({
      ...subscription,
      proofUrl: subscription.payment_proof_url
        ? await getSignedPaymentProofUrl(subscription.payment_proof_url)
        : null,
    }))
  )

  const pending = withProofUrls.filter((subscription) => subscription.status === 'pending')
  const resolved = withProofUrls.filter((subscription) => subscription.status !== 'pending')

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

      {withProofUrls.length === 0 ? (
        <EmptyState message="No hay solicitudes de suscripción." />
      ) : (
        <Tabs defaultValue="pendientes">
          <TabsList>
            <TabsTrigger value="pendientes">Pendientes ({pending.length})</TabsTrigger>
            <TabsTrigger value="resueltas">Resueltas ({resolved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes" className="pt-3">
            {pending.length === 0 ? (
              <EmptyState illustration={<EmptyBoxIllustration />} message="No hay solicitudes pendientes." />
            ) : (
              <SubscriptionsTable subscriptions={pending} />
            )}
          </TabsContent>

          <TabsContent value="resueltas" className="pt-3">
            {resolved.length === 0 ? (
              <EmptyState illustration={<EmptyBoxIllustration />} message="Todavía no hay solicitudes resueltas." />
            ) : (
              <SubscriptionsTable subscriptions={resolved} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
