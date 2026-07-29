import { redirect } from 'next/navigation'
import { Check, Sparkles, Star, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import {
  getActiveSubscriptionPlans,
  getMyActiveSubscription,
  getMyPendingSubscription,
  getMyShop,
} from '@/lib/shops/queries'
import { syncGalioPaySubscription } from '@/lib/galiopay/sync'
import { isServiceRubro } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import { SubscribeButton } from './subscribe-button'

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(dateString)
  )
}

function getBenefitLabels(noun: string, nounPlural: string): Record<string, (value: unknown) => string | null> {
  return {
    max_products: (value) =>
      value === null ? `${nounPlural} ilimitados` : `Hasta ${value} ${noun}s`,
    featured: (value) => (value ? `Destacá tus ${noun}s en el feed` : null),
    analytics: (value) => (value ? 'Estadísticas de tu tienda' : null),
    priority_support: (value) => (value ? 'Soporte prioritario' : null),
  }
}

function getBenefitLines(benefits: unknown, noun: string, nounPlural: string): string[] {
  if (!benefits || typeof benefits !== 'object') return []

  const labels = getBenefitLabels(noun, nounPlural)

  return Object.entries(benefits as Record<string, unknown>)
    .map(([key, value]) => {
      const formatter = labels[key]
      if (formatter) return formatter(value)
      if (value === false || value === null || value === undefined) return null
      return `${key}: ${value}`
    })
    .filter((line): line is string => Boolean(line))
}

const PLAN_ICONS = [Sparkles, Zap, Star]

interface SubscriptionPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function MyShopSubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const shop = await getMyShop()

  if (!shop) redirect('/mi-tienda')

  const { status } = await searchParams

  const pendingSubscription = await getMyPendingSubscription(shop.id)
  let gatewayStatus: string | null = null
  let syncFailed = false

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
      gatewayStatus = result.status
    } catch (error) {
      syncFailed = true
      console.error('mi-tienda/suscripcion: fallo al verificar pago pendiente', {
        subscriptionId: pendingSubscription.id,
        linkId: pendingSubscription.galiopay_link_id,
        error,
      })
    }

    if (activated) {
      redirect('/mi-tienda?subscription=activada')
    }
  }

  const [plans, activeSubscription] = await Promise.all([
    getActiveSubscriptionPlans(),
    getMyActiveSubscription(shop.id),
  ])

  const activePlanId = activeSubscription?.plan_id ?? null
  const freePlanId = !activePlanId ? (plans.find((plan) => plan.price === 0)?.id ?? null) : null
  const currentPlanPrice = activePlanId
    ? (plans.find((plan) => plan.id === activePlanId)?.price ?? 0)
    : 0
  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'
  const nounPlural = isService ? 'Servicios' : 'Productos'

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-heading">Mejorar visibilidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elegí el plan que mejor se adapte a tu comercio
        </p>
      </div>

      {!activePlanId && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {isService ? (
            <p className="text-sm text-foreground">
              <strong>Para un negocio de servicios, lo que más suma no es cuántos servicios cargues</strong>{' '}
              — es que tus clientes puedan dejarte reseñas y que aparezcas mejor posicionado que la
              competencia en el feed. Esos dos beneficios se activan con cualquier plan pago; con el
              plan Free no están disponibles.
            </p>
          ) : (
            <p className="text-sm text-foreground">
              <strong>¿Querés reseñas de tus clientes o mejor posicionamiento en el feed?</strong>{' '}
              Esos dos beneficios se activan con cualquier plan pago — con el plan Free no están
              disponibles.
            </p>
          )}
        </div>
      )}

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
            {gatewayStatus && gatewayStatus !== 'approved' && gatewayStatus !== 'paid' && (
              <p className="text-xs text-muted-foreground">
                Último estado informado por GalioPay: <strong>{gatewayStatus}</strong>. Si ya
                pagaste, puede tardar unos minutos en confirmarse.
              </p>
            )}
            {syncFailed && (
              <p className="text-xs text-destructive">
                No pudimos consultar el estado del pago con GalioPay. Probá verificar de nuevo en
                unos segundos.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {pendingSubscription.galiopay_checkout_url && (
                <Button
                  render={<a href={pendingSubscription.galiopay_checkout_url} />}
                  nativeButton={false}
                  className="flex-1"
                >
                  Continuar pago
                </Button>
              )}
              <Button
                render={<a href="/mi-tienda/suscripcion" />}
                nativeButton={false}
                variant="outline"
                className="flex-1"
              >
                Verificar pago
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {plans.length === 0 ? (
        <EmptyState message="No hay planes disponibles por el momento." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const isFree = plan.price === 0
            const isCurrentPlan = activePlanId ? plan.id === activePlanId : plan.id === freePlanId
            const Icon = PLAN_ICONS[index % PLAN_ICONS.length]
            const visibilityLines = isFree
              ? []
              : ['Reseñas de clientes habilitadas', 'Mejor posicionamiento en el feed']
            const benefitLines = isService
              ? [...visibilityLines, ...getBenefitLines(plan.benefits, noun, nounPlural)]
              : [...getBenefitLines(plan.benefits, noun, nounPlural), ...visibilityLines]

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col overflow-hidden',
                  isCurrentPlan && 'ring-2 ring-primary shadow-md shadow-primary/15'
                )}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 rounded-bl-lg bg-gradient-to-br from-primary to-primary/80 px-3 py-1 text-xs font-medium text-primary-foreground">
                    Plan actual
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" aria-hidden />
                    </span>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="font-mono text-3xl font-semibold">
                      {isFree ? 'Gratis' : formatMoney(plan.price)}
                    </p>
                    {!isFree && (
                      <p className="text-xs text-muted-foreground">cada {plan.duration_days} días</p>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  {benefitLines.length > 0 && (
                    <ul className="flex-1 space-y-2 text-sm">
                      {benefitLines.map((line) => (
                        <li key={line} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isCurrentPlan ? (
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground">
                      {activeSubscription?.end_date
                        ? `Activo hasta el ${formatDate(activeSubscription.end_date)}`
                        : 'Este es tu plan actual'}
                    </div>
                  ) : isFree ? (
                    <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
                      Es tu plan mientras no tengas una suscripción activa
                    </div>
                  ) : (
                    <SubscribeButton
                      planId={plan.id}
                      label={
                        activePlanId
                          ? plan.price > currentPlanPrice
                            ? 'Mejorar a este plan'
                            : 'Cambiar a este plan'
                          : 'Pagar con GalioPay'
                      }
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
