import { PublicHeader, PublicMain } from '@/components/shared/public-header'
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
      <PublicHeader
        user={user ? { email: user.email ?? '' } : null}
        profileRole={profileRole}
        profileFullName={profileFullName}
        profileAvatarUrl={profileAvatarUrl}
      />
      <PublicMain>{children}</PublicMain>
    </div>
  )
}
