import { BottomNav, PublicHeader, PublicMain } from '@/components/shared/public-header'
import { createClient } from '@/lib/supabase/server'
import { getMyClientNotifications } from '@/lib/notifications/queries'

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

  const { notifications, unreadCount } = user
    ? await getMyClientNotifications()
    : { notifications: [], unreadCount: 0 }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-primary/[0.16] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[-12%] left-1/2 -z-10 size-[30rem] -translate-x-1/2 rounded-full bg-primary/[0.18] blur-3xl"
        aria-hidden
      />
      <PublicHeader
        user={user ? { email: user.email ?? '' } : null}
        profileRole={profileRole}
        profileFullName={profileFullName}
        profileAvatarUrl={profileAvatarUrl}
        notifications={notifications}
        unreadNotificationsCount={unreadCount}
      />
      <PublicMain>{children}</PublicMain>
      <BottomNav isLoggedIn={Boolean(user)} />
    </div>
  )
}
