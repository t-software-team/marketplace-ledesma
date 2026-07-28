'use client'

import Link from 'next/link'
import { ArrowLeft, Store } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/shared/user-menu'
import { cn } from '@/lib/utils'

interface PublicHeaderProps {
  user: { email: string } | null
  profileRole: string | null
  profileFullName: string | null
  profileAvatarUrl: string | null
}

const MINIMAL_HEADER_PREFIXES = ['/producto/', '/tienda/']

export function PublicHeader({
  user,
  profileRole,
  profileFullName,
  profileAvatarUrl,
}: PublicHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isMinimal = MINIMAL_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))

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
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-heading text-lg">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Store className="size-4 text-primary" aria-hidden />
          </span>
          <span className="truncate">
            <span className="sm:hidden">Ledesma</span>
            <span className="hidden sm:inline">Marketplace Ledesma</span>
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
              {profileRole === 'superadmin' && (
                <Button variant="outline" size="sm" render={<Link href="/admin/shops" />} nativeButton={false}>
                  Admin
                </Button>
              )}
              {profileRole === 'client' && (
                <Button variant="outline" size="sm" render={<Link href="/favoritos" />} nativeButton={false}>
                  Favoritos
                </Button>
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
        isMinimal ? 'pt-5 pb-6' : 'py-6'
      )}
    >
      {children}
    </main>
  )
}
