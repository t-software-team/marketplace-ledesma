'use client'

import Link from 'next/link'
import { ArrowLeft, Store } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/shared/user-menu'

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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 md:px-6">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push('/')
              }
            }}
            className="flex size-9 items-center justify-center rounded-full bg-surface text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-muted"
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg">
          <Store className="size-5 text-primary" aria-hidden />
          Marketplace Ledesma
        </Link>
        <nav className="flex items-center gap-2">
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
