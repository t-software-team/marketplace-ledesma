'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  CalendarX,
  Clock,
  FileCheck,
  Flag,
  Heart,
  Menu,
  MessageCircle,
  Package,
  ReceiptText,
  ShieldCheck,
  ShieldX,
  Star,
} from 'lucide-react'
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
import { markAllNotificationsRead, deleteReadAdminNotifications } from '@/lib/admin/actions'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { InstallAppButton } from '@/components/shared/install-app-button'
import { ShareButton } from '@/components/shared/share-button'
import { cn } from '@/lib/utils'
import {
  NotificationBell,
  type NotificationItem,
  type NotificationTypeConfigMap,
} from '@/components/shared/notification-bell'

export type AdminNotification = NotificationItem

const NOTIFICATION_TYPE_CONFIG: NotificationTypeConfigMap = {
  new_verification_request: {
    label: 'Nueva solicitud de verificación',
    icon: FileCheck,
    style: 'bg-verified/20 text-verified-foreground',
    href: (notification) => `/admin/shops/${notification.reference_id}`,
  },
  new_subscription_request: {
    label: 'Nueva solicitud de suscripción',
    icon: ReceiptText,
    style: 'bg-primary/15 text-primary',
    href: () => '/admin/subscripciones',
  },
  new_report: {
    label: 'Nuevo reporte de comercio',
    icon: Flag,
    style: 'bg-destructive/15 text-destructive',
    href: () => '/admin/reportes',
  },
  new_review: {
    label: 'Nueva reseña en tu comercio',
    icon: Star,
    style: 'bg-amber-500/15 text-amber-600',
    href: () => '/mi-tienda',
  },
  new_contact: {
    label: 'Nuevo contacto de un cliente',
    icon: MessageCircle,
    style: 'bg-primary/15 text-primary',
    href: () => '/mi-tienda',
  },
  verification_approved: {
    label: 'Tu verificación fue aprobada',
    icon: ShieldCheck,
    style: 'bg-verified/20 text-verified-foreground',
    href: () => '/mi-tienda/configuracion',
  },
  verification_rejected: {
    label: 'Tu verificación fue rechazada',
    icon: ShieldX,
    style: 'bg-destructive/15 text-destructive',
    href: () => '/mi-tienda/configuracion',
  },
  subscription_expiring_soon: {
    label: 'Tu suscripción está por vencer',
    icon: Clock,
    style: 'bg-amber-500/15 text-amber-600',
    href: () => '/mi-tienda/suscripcion',
  },
  subscription_expired: {
    label: 'Tu suscripción venció',
    icon: CalendarX,
    style: 'bg-destructive/15 text-destructive',
    href: () => '/mi-tienda/suscripcion',
  },
  new_product: {
    label: 'Un comercio que seguís publicó algo nuevo',
    icon: Package,
    style: 'bg-primary/10 text-primary',
    href: (notification) => `/producto/${notification.reference_id}`,
  },
  new_turno_request: {
    label: 'Nueva solicitud de turno',
    icon: Calendar,
    style: 'bg-primary/15 text-primary',
    href: () => '/mi-tienda/turnos',
  },
}

interface DashboardHeaderProps {
  navItems: DashboardNavItem[]
  userEmail: string
  userFullName: string | null
  userAvatarUrl: string | null
  notifications?: AdminNotification[]
  unreadNotificationsCount?: number
  showSiteLink?: boolean
  showInstallButton?: boolean
  reviewInvite?: { shopName: string; shopUrl: string }
  accent?: boolean
  onMarkRead?: (id: string) => Promise<void>
  onMarkAllRead?: () => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onDeleteAllRead?: () => Promise<void>
  realtimeTable?: string
  notificationsHref?: string
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

export function DashboardHeader({
  navItems,
  userEmail,
  userFullName,
  userAvatarUrl,
  notifications,
  unreadNotificationsCount,
  showSiteLink = true,
  showInstallButton = true,
  reviewInvite,
  accent = false,
  onMarkRead,
  onMarkAllRead = markAllNotificationsRead,
  onDelete,
  onDeleteAllRead = deleteReadAdminNotifications,
  realtimeTable = 'admin_notifications',
  notificationsHref = '/admin/notificaciones',
}: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isSigningOut, startSignOut] = useTransition()

  return (
    <header
      className={cn(
        'sticky top-0 z-10 border-border bg-background/95 backdrop-blur-sm',
        accent && 'border-t-4 border-t-violet-500'
      )}
    >
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

          {accent && (
            <Badge className="bg-violet-500 text-white hover:bg-violet-500 md:hidden">Admin</Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          
          {showInstallButton && <InstallAppButton />}
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
          {reviewInvite && (
            <ShareButton
              title={reviewInvite.shopName}
              text={`¿Nos regalás una reseña en Proxi? Contanos cómo te fue con ${reviewInvite.shopName}:`}
              url={reviewInvite.shopUrl}
              variant="ghost"
              size="icon"
              icon="star"
              label="Invitar a reseñar"
            />
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
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            typeConfig={NOTIFICATION_TYPE_CONFIG}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
            onDelete={onDelete}
            onDeleteAllRead={onDeleteAllRead}
            realtimeTable={realtimeTable}
            detailHref={notificationsHref}
          />

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
                variant="destructive"
                disabled={isSigningOut}
                onClick={() => startSignOut(() => signOut())}
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
