import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell/dashboard-shell'
import type { DashboardNavItem } from '@/components/dashboard-shell/dashboard-sidebar'
import { isServiceRubro } from '@/lib/category-icons'
import { getMyActiveSubscription } from '@/lib/shops/queries'
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let fullName: string | null = null
  let avatarUrl: string | null = null
  let rubroSlug: string | null = null
  let planName = 'Free'
  let hasCustomBranding = false
  let reviewInvite: { shopName: string; shopUrl: string } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null

    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, slug, categories ( slug )')
      .eq('owner_id', user.id)
      .maybeSingle()

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

  const { notifications, unreadCount } = await getMyClientNotifications()

  const navItems: DashboardNavItem[] = [
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
      showInstallButton={false}
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
