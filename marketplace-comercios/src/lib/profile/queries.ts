import { createClient } from '@/lib/supabase/server'

export async function getMyProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, city, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null

  return { ...profile, email: user.email ?? '' }
}
