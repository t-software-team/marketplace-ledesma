'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Compass, Heart, Home, Package, Search, Store, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserMenu } from '@/components/shared/user-menu'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { InstallAppBanner } from '@/components/shared/install-app-banner'
import {
  markClientNotificationRead,
  markClientNotificationsRead,
  deleteClientNotification,
  deleteReadClientNotifications,
} from '@/lib/notifications/actions'
import {
  NotificationBell,
  type NotificationItem,
  type NotificationTypeConfigMap,
} from '@/components/shared/notification-bell'
import { useFiltersStore } from '@/stores/use-filters-store'
import { useScrolled } from '@/hooks/use-scrolled'
import { cn } from '@/lib/utils'

type ClientNotification = NotificationItem

interface PublicHeaderProps {
  user: { email: string } | null
  profileRole: string | null
  profileFullName: string | null
  profileAvatarUrl: string | null
  notifications?: ClientNotification[]
  unreadNotificationsCount?: number
}

const NOTIFICATION_TYPE_CONFIG: NotificationTypeConfigMap = {
  new_product: {
    label: 'Un comercio que seguís publicó algo nuevo',
    icon: Package,
    style: 'bg-primary/10 text-primary',
    href: (notification) => `/producto/${notification.reference_id}`,
  },
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
  const scrolled = useScrolled()
  const setSearch = useFiltersStore((state) => state.setSearch)
  const [searchInput, setSearchInput] = useState('')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMinimal = MINIMAL_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isFirstPathname = useRef(true)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value)
      if (pathname !== '/') router.push('/')
    }, 350)
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [])

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

  // /tienda/[slug] has its own explicit "Ir al Marketplace" link over the
  // banner (see the shop page), so the generic floating back button would
  // just duplicate/overlap it there.
  const showFloatingBack = isMinimal && !pathname.startsWith('/tienda/')

  if (showFloatingBack) {
    return (
      <>
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
          className="fixed top-3 left-3 z-20 flex size-11 items-center justify-center rounded-full bg-surface/90 text-foreground backdrop-blur-sm transition-colors hover:bg-muted"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="fixed top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full bg-surface/90 text-foreground backdrop-blur-sm transition-colors hover:bg-muted"
          aria-label="Buscar"
        >
          <Search className="size-4.5" aria-hidden />
        </button>
      </>
    )
  }

  if (isMinimal) return null

  return (
    <header
      className={cn(
        'sticky top-0 z-10 transition-colors duration-200',
        scrolled ? 'bg-background/95 backdrop-blur-sm' : 'bg-transparent backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-heading text-lg">
          <span className="relative flex size-8 shrink-0 items-center justify-center">
            <Image src="/brand/logo.png" alt="" fill sizes="28px" className="object-contain" priority />
          </span>
          <span className="truncate">
            <span className="sm:hidden">Proxi</span>
            <span className="hidden sm:inline">Marketplace</span>
          </span>
        </Link>
        {pathname !== '/' && !pathname.startsWith('/comercios') && (
          <>
            <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar en Proxi..."
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-9 pl-9"
                aria-label="Buscar comercios y productos"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 sm:hidden"
              aria-label="Buscar"
              onClick={() => router.push('/')}
            >
              <Search className="size-4.5" aria-hidden />
            </Button>
          </>
        )}
        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/comercios" />}
            nativeButton={false}
            className="hidden sm:inline-flex"
          >
            Comercios
          </Button>
          {user ? (
            <>
              {profileRole === 'shop_admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/mi-tienda" />}
                  nativeButton={false}
                  className="hidden sm:inline-flex"
                >
                  Mi tienda
                </Button>
              )}
              {profileRole === 'client' && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/perfil" />}
                  nativeButton={false}
                  className="hidden sm:inline-flex"
                >
                  ¿Querés vender?
                </Button>
              )}
              <ThemeToggle />
              {profileRole === 'superadmin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/admin/shops" />}
                  nativeButton={false}
                  className="hidden sm:inline-flex"
                >
                  Admin
                </Button>
              )}
              {profileRole && (
                <>
                  <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadNotificationsCount}
                    typeConfig={NOTIFICATION_TYPE_CONFIG}
                    onMarkRead={markClientNotificationRead}
                    onMarkAllRead={markClientNotificationsRead}
                    onDelete={deleteClientNotification}
                    onDeleteAllRead={deleteReadClientNotifications}
                    realtimeTable="client_notifications"
                    detailHref="/notificaciones"
                  />
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
                  <span className="sm:hidden">Perfil</span>
                  <span className="hidden sm:inline">Completar perfil</span>
                </Button>
              )}
              <UserMenu
                userEmail={user.email}
                userFullName={profileFullName}
                userAvatarUrl={profileAvatarUrl}
                profileRole={profileRole}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
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
  const noPaddingTop = pathname.startsWith('/comercios') || pathname === '/'

  return (
    <main
      id="main-content"
      className={cn(
        'mx-auto w-full max-w-5xl flex-1 px-4 md:px-6',
        isMinimal ? 'pt-5 pb-6' : noPaddingTop ? 'pb-24 sm:pb-6' : 'py-6 pb-24 sm:pb-6'
      )}
    >
      {children}
    </main>
  )
}

interface BottomNavProps {
  isLoggedIn: boolean
  profileRole?: string | null
}

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home, exact: true },
  { href: '/favoritos', label: 'Favoritos', icon: Heart, exact: false },
  { href: '/siguiendo', label: 'Siguiendo', icon: Compass, exact: false },
] as const

const LAST_ITEM_SHOP_ADMIN = { href: '/mi-tienda', label: 'Mi tienda', icon: Store, exact: false } as const
const LAST_ITEM_DEFAULT = { href: '/perfil', label: 'Perfil', icon: User, exact: false } as const

export function BottomNav({ isLoggedIn, profileRole }: BottomNavProps) {
  const pathname = usePathname()
  const isMinimal = MINIMAL_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isMinimal) return null

  const items = [
    ...NAV_ITEMS,
    profileRole === 'shop_admin' ? LAST_ITEM_SHOP_ADMIN : LAST_ITEM_DEFAULT,
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-3 sm:hidden [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="mx-auto flex max-w-5xl items-center justify-around gap-1 rounded-2xl bg-background/80 p-1.5 shadow-sm shadow-black/5 backdrop-blur-xl">
        {items.map((item) => {
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
