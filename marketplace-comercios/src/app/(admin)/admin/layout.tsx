import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell/dashboard-shell'
import type { DashboardNavItem } from '@/components/dashboard-shell/dashboard-sidebar'
import { getUnreadNotifications, getUnreadNotificationsCount } from '@/lib/admin/queries'

const navItems: DashboardNavItem[] = [
  { href: '/admin/shops', label: 'Comercios', icon: 'store' },
  { href: '/admin/categorias', label: 'Categorías', icon: 'tag' },
  { href: '/admin/subscripciones', label: 'Suscripciones', icon: 'credit-card' },
  { href: '/admin/reportes', label: 'Reportes', icon: 'flag' },
  { href: '/admin/auditoria', label: 'Auditoría', icon: 'clock' },
]

export default async function AdminLayout({
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

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
  }

  const [notifications, unreadNotificationsCount] = await Promise.all([
    getUnreadNotifications(),
    getUnreadNotificationsCount(),
  ])

  return (
    <DashboardShell
      navItems={navItems}
      userEmail={user?.email ?? ''}
      userFullName={fullName}
      userAvatarUrl={avatarUrl}
      sectionTitle="Administración"
      notifications={notifications}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </DashboardShell>
  )
}
