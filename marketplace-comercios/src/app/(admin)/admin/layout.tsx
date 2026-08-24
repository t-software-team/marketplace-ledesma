import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell/dashboard-shell'
import type { DashboardNavItem } from '@/components/dashboard-shell/dashboard-sidebar'
import { getUnreadNotifications, getUnreadNotificationsCount } from '@/lib/admin/queries'
import {
  markAdminNotificationRead,
  deleteAdminNotification,
  deleteReadAdminNotifications,
} from '@/lib/admin/actions/notifications'
import { CommandPalette } from './command-palette'

const navItems: DashboardNavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/shops', label: 'Comercios', icon: 'store' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
  { href: '/admin/categorias', label: 'Categorías', icon: 'tag' },
  { href: '/admin/subscripciones', label: 'Suscripciones', icon: 'credit-card' },
  { href: '/admin/planes', label: 'Planes', icon: 'package' },
  { href: '/admin/reportes', label: 'Reportes', icon: 'flag' },
  { href: '/admin/auditoria', label: 'Auditoría', icon: 'clock' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Las notificaciones no dependen del usuario/perfil, así que se piden en
  // paralelo con la sesión en vez de esperar a que termine getUser() primero.
  const [
    {
      data: { user },
    },
    notifications,
    unreadNotificationsCount,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getUnreadNotifications(),
    getUnreadNotificationsCount(),
  ])

  let fullName: string | null = null
  let avatarUrl: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
  }

  return (
    <>
      <CommandPalette />
      <DashboardShell
        navItems={navItems}
        userEmail={user?.email ?? ''}
        userFullName={fullName}
        userAvatarUrl={avatarUrl}
        sectionTitle="Admin"
        rootHref="/admin/dashboard"
        accent
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onMarkRead={markAdminNotificationRead}
        onDelete={deleteAdminNotification}
        onDeleteAllRead={deleteReadAdminNotifications}
        realtimeTable="admin_notifications"
        notificationsHref="/admin/notificaciones"
      >
        {children}
      </DashboardShell>
    </>
  )
}
