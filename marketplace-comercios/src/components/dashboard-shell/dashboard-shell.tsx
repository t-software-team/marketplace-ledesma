'use client'

import { useState } from 'react'
import { DashboardSidebar, type DashboardNavItem } from './dashboard-sidebar'
import { DashboardHeader, type AdminNotification } from './dashboard-header'
import { DashboardFooter } from './dashboard-footer'
import { Breadcrumbs } from './breadcrumbs'
import { PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar navItems={navItems} accent={accent} open={sidebarOpen} />
      <div
        className={cn(
          'flex min-h-screen w-full flex-1 flex-col transition-all duration-200',
          sidebarOpen ? 'md:ml-60' : 'md:ml-0'
        )}
      >
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
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          sidebarOpen={sidebarOpen}
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
