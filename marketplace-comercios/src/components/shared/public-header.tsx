'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, Compass, Heart, Home, Store, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserMenu } from '@/components/shared/user-menu'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { markClientNotificationsRead } from '@/lib/notifications/actions'
import { cn } from '@/lib/utils'

interface ClientNotification {
  id: string
  type: string
  reference_id: string
  is_read: boolean
  created_at: string
}

interface PublicHeaderProps {
  user: { email: string } | null
  profileRole: string | null
  profileFullName: string | null
  profileAvatarUrl: string | null
  notifications?: ClientNotification[]
  unreadNotificationsCount?: number
}

const NOTIFICATION_LABELS: Record<string, string> = {
  new_product: 'Un comercio que seguís publicó algo nuevo',
}

function notificationHref(notification: ClientNotification) {
  if (notification.type === 'new_product') return `/producto/${notification.reference_id}`
  return '/'
}

const MINIMAL_HEADER_PREFIXES = ['/producto/', '/tienda/']

export function PublicHeader({
  user,
  profileRole,
  profileFullName,
  profileAvatarUrl,
  notifications = [],
  unreadNotificationsCount = 0,
}: PublicHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMarkingRead, startMarkingRead] = useTransition()
  const isMinimal = MINIMAL_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  function handleMarkAllRead() {
    startMarkingRead(async () => {
      await markClientNotificationsRead()
      router.refresh()
    })
  }

  if (isMinimal) {
    return (
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back()
          } else {
            router.push('/')
          }
        }}
        className="fixed top-3 left-3 z-20 flex size-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md ring-1 ring-border backdrop-blur-sm transition-colors hover:bg-muted"
        aria-label="Volver"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-heading text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Store className="size-4 text-primary" aria-hidden />
          </span>
          <span className="truncate">
            <span className="sm:hidden">Todo</span>
            <span className="hidden sm:inline">Marketplace</span>
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <>
              {profileRole === 'shop_admin' && (
                <Button variant="outline" size="sm" render={<Link href="/mi-tienda" />} nativeButton={false}>
                  Mi tienda
                </Button>
              )}
              {profileRole === 'superadmin' && (
                <Button variant="outline" size="sm" render={<Link href="/admin/shops" />} nativeButton={false}>
                  Admin
                </Button>
              )}
              {profileRole && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="outline" size="icon" className="relative" />}
                      nativeButton={true}
                    >
                      <Bell className="size-4" aria-hidden />
                      {unreadNotificationsCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[10px] font-semibold"
                        >
                          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                        </Badge>
                      )}
                      <span className="sr-only">Notificaciones</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.length === 0 ? (
                        <p className="px-1.5 py-2 text-sm text-muted-foreground">
                          No hay notificaciones nuevas
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            render={<Link href={notificationHref(notification)} />}
                          >
                            <span className="flex flex-col gap-0.5">
                              <span>{NOTIFICATION_LABELS[notification.type] ?? 'Notificación'}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleString('es-AR')}
                              </span>
                            </span>
                          </DropdownMenuItem>
                        ))
                      )}
                      {notifications.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleMarkAllRead} disabled={isMarkingRead}>
                            {isMarkingRead ? 'Marcando...' : 'Marcar todas como leídas'}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="icon"
                    render={<Link href="/favoritos" aria-label="Favoritos" />}
                    nativeButton={false}
                    className="hidden sm:inline-flex"
                  >
                    <Heart className="size-4" aria-hidden />
                  </Button>
                </>
              )}
              {!profileRole && (
                <Button size="sm" render={<Link href="/onboarding" />} nativeButton={false}>
                  Completar perfil
                </Button>
              )}
              <UserMenu
                userEmail={user.email}
                userFullName={profileFullName}
                userAvatarUrl={profileAvatarUrl}
              />
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" render={<Link href="/login" />} nativeButton={false}>
                Ingresar
              </Button>
              <Button size="sm" render={<Link href="/registro" />} nativeButton={false}>
                Registrarse
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMinimal = MINIMAL_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <main
      className={cn(
        'mx-auto w-full max-w-5xl flex-1 px-4 md:px-6',
        isMinimal ? 'pt-5 pb-6' : 'py-6 pb-24 sm:pb-6'
      )}
    >
      {children}
    </main>
  )
}

interface BottomNavProps {
  isLoggedIn: boolean
}

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home, exact: true },
  { href: '/favoritos', label: 'Favoritos', icon: Heart, exact: false },
  { href: '/siguiendo', label: 'Siguiendo', icon: Compass, exact: false },
  { href: '/perfil', label: 'Perfil', icon: User, exact: false },
] as const

export function BottomNav({ isLoggedIn }: BottomNavProps) {
  const pathname = usePathname()
  const isMinimal = MINIMAL_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isMinimal) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm sm:hidden [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const href = isLoggedIn || item.href === '/' ? item.href : '/login'
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
