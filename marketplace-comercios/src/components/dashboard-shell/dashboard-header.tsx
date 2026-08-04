'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, FileCheck, Flag, Heart, Menu, ReceiptText } from 'lucide-react'
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
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { InstallAppButton } from '@/components/shared/install-app-button'
import { COMMAND_PALETTE_OPEN_EVENT } from '@/app/(admin)/admin/command-palette'

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

const NOTIFICATION_ICONS: Record<string, typeof FileCheck> = {
  new_verification_request: FileCheck,
  new_subscription_request: ReceiptText,
  new_report: Flag,
}

const NOTIFICATION_STYLES: Record<string, string> = {
  new_verification_request: 'bg-verified/20 text-verified-foreground',
  new_subscription_request: 'bg-primary/15 text-primary',
  new_report: 'bg-destructive/15 text-destructive',
}

function formatUnreadCount(count: number) {
  return count > 9 ? '9+' : String(count)
}

interface DashboardHeaderProps {
  section: string
  navItems: DashboardNavItem[]
  userEmail: string
  userFullName: string | null
  userAvatarUrl: string | null
  notifications?: AdminNotification[]
  unreadNotificationsCount?: number
  showSiteLink?: boolean
  showInstallButton?: boolean
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
  showSiteLink = true,
  showInstallButton = true,
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
    <header className="sticky top-0 z-10  border-border bg-background/95 backdrop-blur-sm">
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
                <SheetTitle>Proxi Marketplace</SheetTitle>
              </SheetHeader>
              <SidebarNav navItems={navItems} onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {section && <h1 className="font-heading text-lg">{section}</h1>}
        </div>

        <div className="flex items-center gap-1">
          {showInstallButton && <InstallAppButton />}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden gap-1 text-xs text-muted-foreground md:inline-flex"
            onClick={() => window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT))}
            aria-label="Abrir paleta de comandos"
          >
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </Button>
          {showSiteLink && (
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span>Volver al sitio</span>
            </Button>
          )}
          <Button
            render={<Link href="/favoritos" aria-label="Favoritos" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
          >
            <Heart className="size-4" aria-hidden />
          </Button>
          <ThemeToggle />
          {notificationList && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="relative" />}
                nativeButton={true}
              >
                <Bell className="size-5" aria-hidden />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1 right-1 size-2.5 animate-ping rounded-full bg-destructive opacity-75" />
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[10px] font-semibold shadow-sm"
                    >
                      {formatUnreadCount(unreadCount)}
                    </Badge>
                  </>
                )}
                <span className="sr-only">Notificaciones</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-1.5 py-1">
                  <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="rounded-full px-1.5 text-[10px]">
                      {formatUnreadCount(unreadCount)} nuevas
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notificationList.length === 0 ? (
                  <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">
                    No hay notificaciones nuevas
                  </p>
                ) : (
                  notificationList.map((notification) => {
                    const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell
                    const style = NOTIFICATION_STYLES[notification.type] ?? 'bg-muted text-muted-foreground'
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        render={<Link href={notificationHref(notification)} />}
                        className="items-start gap-2.5 py-2"
                      >
                        <span
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${style}`}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm leading-snug">
                            {NOTIFICATION_LABELS[notification.type] ?? 'Notificación'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('es-AR')}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    )
                  })
                )}
                {notificationList.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleMarkAllRead}
                      disabled={isMarkingRead}
                      className="justify-center text-sm font-medium text-primary"
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
