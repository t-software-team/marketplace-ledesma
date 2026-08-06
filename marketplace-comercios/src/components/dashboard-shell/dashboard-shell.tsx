import { DashboardSidebar, type DashboardNavItem } from './dashboard-sidebar'
import { DashboardHeader, type AdminNotification } from './dashboard-header'
import { DashboardFooter } from './dashboard-footer'
import { Breadcrumbs } from './breadcrumbs'

interface DashboardShellProps {
  navItems: DashboardNavItem[]
  userEmail: string
  userFullName: string | null
  userAvatarUrl: string | null
  sectionTitle: string
  rootHref: string
  accent?: boolean
  notifications?: AdminNotification[]
  unreadNotificationsCount?: number
  showSiteLink?: boolean
  showInstallButton?: boolean
  children: React.ReactNode
}

export function DashboardShell({
  navItems,
  userEmail,
  userFullName,
  userAvatarUrl,
  sectionTitle,
  rootHref,
  accent = false,
  notifications,
  unreadNotificationsCount,
  showSiteLink,
  showInstallButton,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar navItems={navItems} accent={accent} />
      <div className="flex min-h-screen w-full flex-1 flex-col md:ml-60">
        <DashboardHeader
          navItems={navItems}
          userEmail={userEmail}
          userFullName={userFullName}
          userAvatarUrl={userAvatarUrl}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          showSiteLink={showSiteLink}
          showInstallButton={showInstallButton}
          accent={accent}
        />
        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
          <Breadcrumbs navItems={navItems} rootHref={rootHref} rootLabel={sectionTitle} className="mb-4" />
          {children}
        </main>
        <DashboardFooter />
      </div>
    </div>
  )
}
