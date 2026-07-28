import Link from 'next/link'
import { Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/shared/user-menu'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profileRole: string | null = null
  let profileFullName: string | null = null
  let profileAvatarUrl: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', user.id)
      .single()
    profileRole = profile?.role ?? null
    profileFullName = profile?.full_name ?? null
    profileAvatarUrl = profile?.avatar_url ?? null
  }

  return (
    <div className="flex min-h-screen flex-col">
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
                  userEmail={user.email ?? ''}
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">{children}</main>
    </div>
  )
}
