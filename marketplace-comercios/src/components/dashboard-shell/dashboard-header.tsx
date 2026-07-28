'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SidebarNav, type DashboardNavItem } from './dashboard-sidebar'
import { signOut } from '@/lib/auth/actions'
import { markAllNotificationsRead } from '@/lib/admin/actions'
import { createClient } from '@/lib/supabase/client'

export interface AdminNotification {
  id: string
  type: string
  reference_id: string
  created_at: string
}

const NOTIFICATION_LABELS: Record<string, string> = {
  new_verification_request: 'Nueva solicitud de verificación',
  new_subscription_request: 'Nueva solicitud de suscripción',
  new_report: 'Nuevo reporte de comercio',
}

const NOTIFICATION_LINKS: Record<string, string> = {
  new_verification_request: '/admin/shops',
  new_subscription_request: '/admin/subscripciones',
  new_report: '/admin/reportes',
}

interface DashboardHeaderProps {
  section: string
  navItems: DashboardNavItem[]
  userEmail: string
  userFullName: string | null
  userAvatarUrl: string | null
  notifications?: AdminNotification[]
  unreadNotificationsCount?: number
}

function getInitials(fullName: string | null, email: string) {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    const initials = parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    if (initials) return initials
  }
  return email[0]?.toUpperCase() ?? '?'
}

function notificationHref(notification: AdminNotification) {
  if (notification.type === 'new_verification_request') {
    return `/admin/shops/${notification.reference_id}`
  }
  return NOTIFICATION_LINKS[notification.type] ?? '/admin'
}

export function DashboardHeader({
  section,
  navItems,
  userEmail,
  userFullName,
  userAvatarUrl,
  notifications,
  unreadNotificationsCount,
}: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isMarkingRead, startMarkingRead] = useTransition()
  const router = useRouter()
  const [extraNotifications, setExtraNotifications] = useState<AdminNotification[]>([])
  const [extraUnreadCount, setExtraUnreadCount] = useState(0)
  const [syncedNotifications, setSyncedNotifications] = useState(notifications)

  if (notifications !== syncedNotifications) {
    setSyncedNotifications(notifications)
    setExtraNotifications([])
    setExtraUnreadCount(0)
  }

  useEffect(() => {
    if (notifications === undefined) return

    const supabase = createClient()
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const row = payload.new as AdminNotification
          setExtraNotifications((current) => [row, ...current].slice(0, 10))
          setExtraUnreadCount((current) => current + 1)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [notifications])

  const notificationList = notifications
    ? [...extraNotifications, ...notifications].slice(0, 10)
    : null
  const unreadCount = (unreadNotificationsCount ?? 0) + extraUnreadCount

  function handleMarkAllRead() {
    startMarkingRead(async () => {
      await markAllNotificationsRead()
      setExtraNotifications([])
      setExtraUnreadCount(0)
      router.refresh()
    })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
              nativeButton={true}
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Abrir menú</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>Marketplace Ledesma</SheetTitle>
              </SheetHeader>
              <SidebarNav navItems={navItems} onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="font-heading text-lg">{section}</h1>
        </div>

        <div className="flex items-center gap-1">
          {notificationList && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="relative" />}
                nativeButton={true}
              >
                <Bell className="size-5" aria-hidden />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute top-0.5 right-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notificaciones</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationList.length === 0 ? (
                  <p className="px-1.5 py-2 text-sm text-muted-foreground">
                    No hay notificaciones nuevas
                  </p>
                ) : (
                  notificationList.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      render={<Link href={notificationHref(notification)} />}
                    >
                      <span className="flex flex-col gap-0.5">
                        <span>
                          {NOTIFICATION_LABELS[notification.type] ?? 'Notificación'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString('es-AR')}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                {notificationList.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleMarkAllRead}
                      disabled={isMarkingRead}
                    >
                      {isMarkingRead ? 'Marcando...' : 'Marcar todas como leídas'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de cuenta" />
              }
              nativeButton={true}
            >
              <Avatar>
                {userAvatarUrl && (
                  <AvatarImage src={userAvatarUrl} alt={userFullName ?? userEmail} />
                )}
                <AvatarFallback>{getInitials(userFullName, userEmail)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{userFullName ?? 'Usuario'}</span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left">
                      Cerrar sesión
                    </button>
                  </form>
                }
                variant="destructive"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
