import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { getActiveSubscriptionPlans, getMyPendingSubscription, getMyShop } from '@/lib/shops/queries'
import { startSubscriptionCheckout } from '@/lib/shops/actions'
import { syncGalioPaySubscription } from '@/lib/galiopay/sync'

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

function renderBenefits(benefits: unknown) {
  if (!benefits || typeof benefits !== 'object') return null

  const entries = Object.entries(benefits as Record<string, unknown>).filter(
    ([, value]) => value !== false && value !== null && value !== undefined
  )

  if (entries.length === 0) return null

  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      {entries.map(([key, value]) => (
        <li key={key}>
          • {key}
          {typeof value !== 'boolean' ? `: ${value}` : ''}
        </li>
      ))}
    </ul>
  )
}

interface SubscriptionPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function MyShopSubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const shop = await getMyShop()

  if (!shop) redirect('/mi-tienda')

  const { status } = await searchParams

  let pendingSubscription = await getMyPendingSubscription(shop.id)

  if (
    pendingSubscription?.galiopay_link_id &&
    pendingSubscription.galiopay_proof_token &&
    status !== 'failure'
  ) {
    let activated = false

    try {
      const result = await syncGalioPaySubscription(
        pendingSubscription.id,
        pendingSubscription.galiopay_link_id,
        pendingSubscription.galiopay_proof_token
      )
      activated = result.activated
    } catch (error) {
      console.error('mi-tienda/suscripcion: fallo al verificar pago pendiente', {
        subscriptionId: pendingSubscription.id,
        error,
      })
    }

    if (activated) {
      redirect('/mi-tienda?subscription=activada')
    }
  }

  const plans = await getActiveSubscriptionPlans()

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-heading">Mejorar visibilidad</h1>

      {status === 'failure' && (
        <p className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          El pago no se completó. Podés intentarlo de nuevo cuando quieras.
        </p>
      )}

      {pendingSubscription ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm">
              Tenés un pago en curso para el plan{' '}
              <strong>{pendingSubscription.subscription_plans?.name ?? ''}</strong>. Si saliste de
              GalioPay antes de terminar, podés retomarlo desde donde quedó.
            </p>
            {pendingSubscription.galiopay_checkout_url && (
              <Button render={<a href={pendingSubscription.galiopay_checkout_url} />} className="w-full">
                Continuar pago
              </Button>
            )}
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <EmptyState message="No hay planes disponibles por el momento." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-heading">{formatMoney(plan.price)}</p>
                <p className="text-sm text-muted-foreground">{plan.duration_days} días</p>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                {renderBenefits(plan.benefits)}
                <form action={startSubscriptionCheckout.bind(null, plan.id)}>
                  <Button type="submit" className="w-full">
                    Pagar con GalioPay
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
