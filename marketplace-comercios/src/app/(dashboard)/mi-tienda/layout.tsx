import { headers } from 'next/headers'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell/dashboard-shell'
import type { DashboardNavItem } from '@/components/dashboard-shell/dashboard-sidebar'
import { isGymRubro, isServiceRubro } from '@/lib/category-icons'
import { getMyActiveSubscription, getMyShop } from '@/lib/shops/queries'
import { getMyClientNotifications } from '@/lib/notifications/queries'
import {
  markClientNotificationRead,
  markClientNotificationsRead,
  deleteClientNotification,
  deleteReadClientNotifications,
} from '@/lib/notifications/actions'

export default async function MiTiendaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const user = await getAuthUser()

  let fullName: string | null = null
  let avatarUrl: string | null = null
  let rubroSlug: string | null = null
  let planName = 'Free'
  let hasCustomBranding = false
  let reviewInvite: { shopName: string; shopUrl: string } | null = null

  // Notificaciones no dependen del perfil/tienda, así que corren en paralelo
  // en vez de esperar a que termine ese bloque primero.
  const [profileAndShop, { notifications, unreadCount }] = await Promise.all([
    user
      ? Promise.all([
          supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
          getMyShop(),
        ])
      : Promise.resolve(null),
    getMyClientNotifications(),
  ])

  if (profileAndShop) {
    const [{ data: profile, error: profileError }, shop] = profileAndShop

    if (profileError)
      console.error('MiTiendaLayout: fallo al traer profile', { userId: user?.id, error: profileError })

    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null

    rubroSlug = shop?.categories?.slug ?? null

    if (shop) {
      const headersList = await headers()
      const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
      const protocol = headersList.get('x-forwarded-proto') ?? 'http'
      reviewInvite = { shopName: shop.name, shopUrl: `${protocol}://${host}/tienda/${shop.slug}` }

      const activeSubscription = await getMyActiveSubscription(shop.id)
      planName = activeSubscription?.subscription_plans?.name ?? 'Free'
      hasCustomBranding = Boolean(
        (activeSubscription?.subscription_plans?.benefits as { custom_branding?: boolean } | null)
          ?.custom_branding
      )
    }
  }

  const isService = isServiceRubro(rubroSlug)
  const isGym = isGymRubro(rubroSlug)

  // Gyms swap the catalog-first nav for gym-management sections, but still
  // get to sell services (visible in the feed like any product) and
  // personalize their public page — both features are shop-generic, only the
  // nav previously left them out.
  const navItems: DashboardNavItem[] = isGym
    ? [
        { href: '/mi-tienda', label: 'Resumen', icon: 'dashboard' },
        { href: '/mi-tienda/socios', label: 'Socios', icon: 'users' },
        { href: '/mi-tienda/ingresos', label: 'Ingresos', icon: 'login' },
        { href: '/mi-tienda/planes', label: 'Planes', icon: 'tag' },
        { href: '/mi-tienda/productos', label: 'Servicios', icon: 'package' },
        { href: '/mi-tienda/caja', label: 'Caja', icon: 'wallet' },
        {
          href: '/mi-tienda/personalizar',
          label: 'Personalizar',
          icon: 'sparkles',
          badge: hasCustomBranding ? undefined : 'PRO',
        },
        { href: '/mi-tienda/suscripcion', label: 'Suscripción', icon: 'credit-card', badge: planName },
        { href: '/mi-tienda/configuracion', label: 'Configuración', icon: 'settings' },
      ]
    : [
        { href: '/mi-tienda', label: 'Resumen', icon: 'store' },
        { href: '/mi-tienda/productos', label: isService ? 'Servicios' : 'Productos', icon: 'package' },
        { href: '/mi-tienda/promociones', label: 'Promociones', icon: 'megaphone' },
        {
          href: '/mi-tienda/personalizar',
          label: 'Personalizar',
          icon: 'sparkles',
          badge: hasCustomBranding ? undefined : 'PRO',
        },
        { href: '/mi-tienda/suscripcion', label: 'Planes', icon: 'credit-card', badge: planName },
        { href: '/mi-tienda/configuracion', label: 'Configuración', icon: 'settings' },
      ]

  return (
    <DashboardShell
      navItems={navItems}
      userEmail={user?.email ?? ''}
      userFullName={fullName}
      userAvatarUrl={avatarUrl}
      sectionTitle="Mi tienda"
      rootHref="/mi-tienda"
      showInstallButton={isGym}
      showSiteLink={!isGym}
      installLabel={isGym ? 'Descargar app' : undefined}
      reviewInvite={reviewInvite ?? undefined}
      notifications={notifications}
      unreadNotificationsCount={unreadCount}
      onMarkRead={markClientNotificationRead}
      onMarkAllRead={markClientNotificationsRead}
      onDelete={deleteClientNotification}
      onDeleteAllRead={deleteReadClientNotifications}
      realtimeTable="client_notifications"
      notificationsHref="/mi-tienda/notificaciones"
    >
      {children}
    </DashboardShell>
  )
}
