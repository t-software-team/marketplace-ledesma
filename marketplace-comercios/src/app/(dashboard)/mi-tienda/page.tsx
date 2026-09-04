import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Eye, MessageCircle, Package, Percent, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShopLinkCard } from '@/components/shop/shop-link-card'
import { ShopProfileHeader } from '@/components/shop/shop-profile-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { TrendAreaChart } from '@/components/shared/trend-area-chart'
import { isGymRubro, isServiceRubro, isVeterinariaRubro } from '@/lib/category-icons'
import { planMatchesShop } from '@/lib/shops/plan-scope'
import { GymResumen } from '@/components/gym/gym-resumen'
import { VetResumen } from '@/components/vet/vet-resumen'
import { getVetResumenProps } from '@/components/vet/vet-resumen-data'
import { getGymDashboardStats, getMyGymAccess, getRecentGymCheckIns } from '@/lib/gym/queries'
import { getBenefitLines } from '@/lib/shops/benefits'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import {
  getActiveCategories,
  getActiveSubscriptionPlans,
  getFreeProductMax,
  getGymMemberLimitInfo,
  getMyActiveSubscription,
  getMyShop,
  getMyShopProducts,
  getShopContactsSeries,
  getShopFollowStats,
} from '@/lib/shops/queries'
import { CreateShopForm } from './create-shop-form'
import { OnboardingChecklist } from './onboarding-checklist'
import { ScrollToTop } from './scroll-to-top'
import { SubscriptionBenefits } from './subscription-benefits'

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
    // Not an owner — a gym employee (see shop_staff) has no shop of their own
    // and no Resumen to look at; send them straight to their actual work.
    const gymAccess = await getMyGymAccess()
    if (gymAccess?.role === 'staff') {
      redirect('/mi-tienda/ingresos')
    }

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

  // Gyms get a dedicated management dashboard instead of the catalog resumen.
  if (isGymRubro(shop.categories?.slug)) {
    const [stats, memberLimit, recentCheckIns] = await Promise.all([
      getGymDashboardStats(shop.id),
      getGymMemberLimitInfo(shop.id),
      getRecentGymCheckIns(shop.id),
    ])
    return (
      <GymResumen
        shopName={shop.name}
        logoUrl={shop.logo_url}
        stats={stats}
        memberLimit={memberLimit}
        recentCheckIns={recentCheckIns}
      />
    )
  }

  // Veterinarias get a dedicated management dashboard instead of the catalog
  // resumen — mismo criterio que gyms, antes de calcular nada del flujo genérico.
  if (isVeterinariaRubro(shop.categories?.slug)) {
    return <VetResumen {...(await getVetResumenProps(shop))} />
  }

  const isService = isServiceRubro(shop.categories?.slug)

  const [productsResult, contactsSeries, activeSubscription, allPlans, followerCount, freeMaxForShop] =
    await Promise.all([
      getMyShopProducts(shop.id, 1, 4),
      getShopContactsSeries(shop.id, 14),
      getMyActiveSubscription(shop.id),
      getActiveSubscriptionPlans(),
      getShopFollowStats(shop.id),
      getFreeProductMax(isService, shop.category_id),
    ])
  const { products: recentProducts, totalCount: productsCount } = productsResult
  const contactsThisWeek = contactsSeries.slice(-7).reduce((sum, day) => sum + day.contactos, 0)
  const conversionRate =
    shop.profile_views > 0 ? Math.round((shop.whatsapp_clicks / shop.profile_views) * 100) : null
  const noun = isService ? 'servicio' : 'producto'
  const nounPlural = isService ? 'Servicios' : 'Productos'

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const shopUrl = `${protocol}://${host}/tienda/${shop.slug}`

  const daysUntilExpiry = shop.subscription_expires_at ? daysUntil(shop.subscription_expires_at) : null

  const freePlan = allPlans.find(
    (plan) => plan.price === 0 && planMatchesShop(plan, { categoryId: shop.category_id, isService })
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
      <ScrollToTop />
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
        <ShopProfileHeader
          shopName={shop.name}
          logoUrl={shop.logo_url}
          coverUrl={shop.cover_url}
          shopSlug={shop.slug}
          shopUrl={shopUrl}
          isVerified={hasVerifiedBadge(shop)}
          verificationStatus={shop.verification_status}
          isPaused={shop.is_paused}
          pausedReason={shop.paused_reason}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="font-heading text-lg">Tu alcance</h2>
          <p className="text-sm text-muted-foreground">
            Cada vez que compartís tu link en redes o WhatsApp, esto crece. Es tu mejor forma de
            conseguir clientes nuevos sin gastar en publicidad.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-5">
          <Card>
            <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
              <Package className="size-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-xs text-muted-foreground">{nounPlural}</p>
              <p className="text-xl font-heading sm:text-2xl">{productsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
              <Eye className="size-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-xs text-muted-foreground">Vistas</p>
              <p className="text-xl font-heading font-mono sm:text-2xl">{shop.profile_views}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
              <MessageCircle className="size-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-xs text-muted-foreground">Clicks WhatsApp</p>
              <p className="text-xl font-heading font-mono sm:text-2xl">{shop.whatsapp_clicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
              <Users className="size-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-xs text-muted-foreground">Seguidores</p>
              <p className="text-xl font-heading font-mono sm:text-2xl">{followerCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 px-3 pt-4 sm:px-6 sm:pt-6">
              <Percent className="size-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-xs text-muted-foreground">Conversión</p>
              <p className="text-xl font-heading font-mono sm:text-2xl">
                {conversionRate === null ? '—' : `${conversionRate}%`}
              </p>
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
            <SubscriptionBenefits lines={benefitLines} />
          </CardContent>
        </Card>
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
                  {product.main_image ? (
                    <Image
                      src={product.main_image}
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
