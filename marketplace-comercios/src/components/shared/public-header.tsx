'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Bell, Compass, Heart, Home, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
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
import { InstallAppBanner } from '@/components/shared/install-app-banner'
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

// In-memory (not sessionStorage) on purpose: sessionStorage gets CLONED into
// tabs opened via target="_blank" (e.g. "Ver tienda pública"), so a counter
// stored there would wrongly say "navigated within app" in a brand-new tab
// that has no real back history. A module-level variable starts fresh in
// every tab/reload, since each gets its own JS execution context.
let internalNavCount = 0

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
  const isFirstPathname = useRef(true)

  // `window.history.length` is unreliable on mobile: opening a product/shop
  // link from WhatsApp, Instagram or a QR code often reports length > 1 with
  // no real in-app page behind it, so router.back() bounces the user out of
  // the site instead of going to the feed. Track real in-app navigations
  // instead and only use router.back() once we know one happened.
  useEffect(() => {
    if (isFirstPathname.current) {
      isFirstPathname.current = false
      return
    }
    internalNavCount += 1
  }, [pathname])

  function handleMarkAllRead() {
    startMarkingRead(async () => {
      await markClientNotificationsRead()
      router.refresh()
    })
  }

  // /tienda/[slug] has its own explicit "Ir al Marketplace" link over the
  // banner (see the shop page), so the generic floating back button would
  // just duplicate/overlap it there.
  const showFloatingBack = isMinimal && !pathname.startsWith('/tienda/')

  if (showFloatingBack) {
    return (
      <button
        type="button"
        onClick={() => {
          const navigatedWithinApp = internalNavCount > 0

          if (navigatedWithinApp) {
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

  if (isMinimal) return null

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-heading text-lg">
          <span className="relative flex size-8 shrink-0 items-center justify-center">
            <Image src="/brand/logo.png" alt="" fill className="object-contain" priority />
          </span>
          <span className="truncate">
            <span className="sm:hidden">Proxi</span>
            <span className="hidden sm:inline">Marketplace</span>
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              {profileRole === 'shop_admin' && (
                <Button variant="outline" size="sm" render={<Link href="/mi-tienda" />} nativeButton={false}>
                  Mi tienda
                </Button>
              )}
              <ThemeToggle />
              {profileRole === 'superadmin' && (
                <Button variant="outline" size="sm" render={<Link href="/admin/shops" />} nativeButton={false}>
                  Admin
                </Button>
              )}
              {profileRole && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="relative" />}
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
                    variant="ghost"
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
              <ThemeToggle />
            </>
          )}
        </nav>
      </div>
      <InstallAppBanner />
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
    <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-3 sm:hidden [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="mx-auto flex max-w-5xl items-center justify-around gap-1 rounded-2xl border border-border/60 bg-background/80 p-1.5 shadow-lg shadow-black/10 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const href = isLoggedIn || item.href === '/' ? item.href : '/login'
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'group relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground active:scale-95 active:bg-muted'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'size-5 transition-transform duration-200',
                  isActive ? 'scale-105' : 'group-active:scale-90'
                )}
                aria-hidden
              />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
