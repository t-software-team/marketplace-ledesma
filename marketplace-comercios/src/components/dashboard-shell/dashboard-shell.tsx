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
  installLabel?: string
  reviewInvite?: { shopName: string; shopUrl: string }
  onMarkRead?: (id: string) => Promise<void>
  onMarkAllRead?: () => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onDeleteAllRead?: () => Promise<void>
  realtimeTable?: string
  notificationsHref?: string
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
  installLabel,
  reviewInvite,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onDeleteAllRead,
  realtimeTable,
  notificationsHref,
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
          installLabel={installLabel}
          reviewInvite={reviewInvite}
          accent={accent}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
          onDelete={onDelete}
          onDeleteAllRead={onDeleteAllRead}
          realtimeTable={realtimeTable}
          notificationsHref={notificationsHref}
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
