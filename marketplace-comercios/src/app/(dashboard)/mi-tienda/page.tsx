import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Check, Eye, MessageCircle, Package, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShopLinkCard } from '@/components/shop/shop-link-card'
import { ShopQrDialog } from '@/components/shop/shop-qr-dialog'
import { ShareButton } from '@/components/shared/share-button'
import { StatusBadge } from '@/components/shared/status-badge'
import { TrendAreaChart } from '@/components/shared/trend-area-chart'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { isServiceRubro } from '@/lib/category-icons'
import { getBenefitLines } from '@/lib/shops/benefits'
import {
  getActiveCategories,
  getActiveSubscriptionPlans,
  getMyActiveSubscription,
  getMyShop,
  getMyShopProducts,
  getShopContactsSeries,
} from '@/lib/shops/queries'
import { CreateShopForm } from './create-shop-form'
import { OnboardingChecklist } from './onboarding-checklist'

const subscriptionLabels: Record<string, string> = {
  none: 'Sin suscripción',
  pending: 'Pendiente de pago',
  active: 'Activa',
  expired: 'Vencida',
  rejected: 'Rechazada',
}

function daysUntil(dateString: string) {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatPrice(price: number | null, currency: string) {
  if (price == null) return 'Consultar'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

interface MyShopPageProps {
  searchParams: Promise<{ subscription?: string; saved?: string; warning?: string }>
}

export default async function MyShopPage({ searchParams }: MyShopPageProps) {
  const { subscription, saved, warning } = await searchParams
  const shop = await getMyShop()

  if (!shop) {
    const categories = await getActiveCategories()
    return (
      <div className="-mx-4 -my-6 md:-mx-6 sm:mx-0 sm:my-0">
        <div className="mx-auto space-y-4 px-4 py-6 sm:max-w-md sm:px-0 sm:py-8">
          <Card className="rounded-none ring-0 sm:rounded-xl sm:ring-1">
            <CardHeader>
              <CardTitle>¡Bienvenido! Vamos a crear tu tienda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Son solo unos datos para arrancar. No te preocupes si no queda perfecto — podés
                cambiar todo después.
              </p>
              <CreateShopForm categories={categories} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const [productsResult, contactsSeries, activeSubscription, allPlans] = await Promise.all([
    getMyShopProducts(shop.id, 1, 4),
    getShopContactsSeries(shop.id, 14),
    getMyActiveSubscription(shop.id),
    getActiveSubscriptionPlans(),
  ])
  const { products: recentProducts, totalCount: productsCount } = productsResult
  const contactsThisWeek = contactsSeries.slice(-7).reduce((sum, day) => sum + day.contactos, 0)
  const isService = isServiceRubro(shop.categories?.slug)
  const noun = isService ? 'servicio' : 'producto'
  const nounPlural = isService ? 'Servicios' : 'Productos'

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const shopUrl = `${protocol}://${host}/tienda/${shop.slug}`

  const daysUntilExpiry = shop.subscription_expires_at ? daysUntil(shop.subscription_expires_at) : null

  const freeMaxForShop = isService ? 3 : 15
  const freePlan = allPlans.find(
    (plan) =>
      plan.price === 0 && (plan.applies_to === 'all' || plan.applies_to === (isService ? 'service' : 'product'))
  )

  const planName = activeSubscription?.subscription_plans?.name ?? freePlan?.name ?? 'Free'
  const planBenefits = activeSubscription
    ? activeSubscription.subscription_plans?.benefits
    : freePlan
      ? { ...(freePlan.benefits as object), max_products: freeMaxForShop }
      : null
  const benefitLines = getBenefitLines(planBenefits, noun, nounPlural)

  const isExpired = shop.subscription_status === 'expired'
  const isExpiringSoon =
    shop.subscription_status === 'active' && daysUntilExpiry !== null && daysUntilExpiry <= 7

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {subscription === 'activada' && (
        <p className="rounded-lg border border-success bg-success/30 p-3 text-sm text-success-foreground">
          ¡Listo! Tu pago se acreditó y tu suscripción ya está activa.
        </p>
      )}

      {saved === '1' && (
        <p className="rounded-lg border border-success bg-success/30 p-3 text-sm text-success-foreground">
          Cambios guardados con éxito.
        </p>
      )}

      {warning && (
        <p className="rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning-foreground">
          {warning}
        </p>
      )}

      {(isExpired || isExpiringSoon) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning bg-warning/10 p-3">
          <p className="text-sm text-warning-foreground">
            {isExpired
              ? 'Tu suscripción venció. Volviste al plan Free hasta que renueves.'
              : daysUntilExpiry === 0
                ? 'Tu suscripción vence hoy.'
                : `Tu suscripción vence en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}.`}
          </p>
          <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false} size="sm">
            {isExpired ? 'Renovar' : 'Ver planes'}
          </Button>
        </div>
      )}

      <OnboardingChecklist
        hasCategory={Boolean(shop.category_id)}
        hasBranding={Boolean(shop.logo_url)}
        hasProducts={productsCount > 0}
        isVerified={shop.verification_status === 'verified'}
        isSubscribed={shop.subscription_status === 'active'}
        noun={noun}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="relative h-28 bg-gradient-to-br from-primary/30 to-destacado/30 sm:h-36">
          {shop.cover_url && (
            <Image
              src={shop.cover_url}
              alt={`Portada de ${shop.name}`}
              fill
              className="object-cover"
              sizes="768px"
            />
          )}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4">
          <div className="flex items-end gap-3">
            <div className="relative -mt-8 size-16 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-muted sm:size-20">
              {shop.logo_url ? (
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Store className="size-6" aria-hidden />
                </div>
              )}
            </div>
            <div className="pb-0.5">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-heading sm:text-2xl">{shop.name}</h1>
                {shop.verification_status === 'verified' && <VerifiedStamp className="size-6" />}
              </div>
              {shop.is_paused ? (
                <Badge variant="warning" className="mt-1">
                  En pausa{shop.paused_reason ? `: ${shop.paused_reason}` : ''}
                </Badge>
              ) : (
                <StatusBadge status={shop.verification_status} className="mt-1" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <ShopQrDialog shopName={shop.name} shopUrl={shopUrl} triggerVariant="icon" />
            <ShareButton
              title={shop.name}
              text={`Mirá ${shop.name} en Proxi Marketplace`}
              url={shopUrl}
              variant="outline"
              size="icon"
            />
            <Button
              render={<Link href={`/tienda/${shop.slug}`} target="_blank" />}
              nativeButton={false}
              variant="outline"
              className="gap-1.5"
            >
              Ver tienda pública
            </Button>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 md:px-6">
          <ShareButton
            title={shop.name}
            text={`¿Nos regalás una reseña en Proxi? Contanos cómo te fue con ${shop.name}:`}
            url={shopUrl}
            variant="ghost"
            size="sm"
            icon="star"
            label="Invitar a reseñar"
            copiedLabel="Link copiado"
            className="w-full justify-center sm:w-auto"
          />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Suscripción</p>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={shop.subscription_status}
                  label={
                    shop.subscription_status === 'active' || shop.subscription_status === 'none'
                      ? planName
                      : subscriptionLabels[shop.subscription_status]
                  }
                />
                {shop.subscription_expires_at && (
                  <span className="text-xs text-muted-foreground">
                    Vence {new Date(shop.subscription_expires_at).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>
            </div>
            <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false} size="sm">
              {shop.subscription_status === 'active' ? 'Ver planes' : 'Mejorar visibilidad'}
            </Button>
          </div>
          {benefitLines.length > 0 && (
            <ul className="grid gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-2">
              {benefitLines.map((line) => (
                <li key={line} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="font-heading text-lg">Tu alcance</h2>
          <p className="text-sm text-muted-foreground">
            Cada vez que compartís tu link en redes o WhatsApp, esto crece. Es tu mejor forma de
            conseguir clientes nuevos sin gastar en publicidad.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="space-y-1 pt-6">
              <Package className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-xs text-muted-foreground">{nounPlural}</p>
              <p className="text-2xl font-heading">{productsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <Eye className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-xs text-muted-foreground">Vistas</p>
              <p className="text-2xl font-heading font-mono">{shop.profile_views}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <MessageCircle className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-xs text-muted-foreground">Clicks WhatsApp</p>
              <p className="text-2xl font-heading font-mono">{shop.whatsapp_clicks}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Contactos por WhatsApp</p>
                <p className="text-xs text-muted-foreground">Últimos 14 días</p>
              </div>
              <p className="font-mono text-lg font-semibold text-primary">
                {contactsThisWeek} <span className="text-xs font-normal text-muted-foreground">esta semana</span>
              </p>
            </div>
            <TrendAreaChart
              data={contactsSeries}
              dataKey="contactos"
              label="Contactos"
              gradientId="shopContacts"
            />
          </CardContent>
        </Card>

        <ShopLinkCard shopName={shop.name} shopUrl={shopUrl} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">{nounPlural}</h2>
          <div className="flex gap-2">
            {productsCount > 0 && (
              <Button render={<Link href="/mi-tienda/productos" />} nativeButton={false} variant="outline" size="sm">
                Ver todos
              </Button>
            )}
            <Button render={<Link href="/mi-tienda/productos/nuevo" />} nativeButton={false} size="sm">
              Nuevo {noun}
            </Button>
          </div>
        </div>

        {recentProducts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no cargaste ningún {noun}. Agregá el primero para aparecer en el feed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                href="/mi-tienda/productos"
                className="overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary"
              >
                <div className="relative aspect-square bg-muted">
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-xs font-medium">{product.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
