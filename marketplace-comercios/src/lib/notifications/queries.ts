import { createClient } from '@/lib/supabase/server'

export async function getMyClientNotifications() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { notifications: [], unreadCount: 0 }

  const [{ data: notifications }, { count }] = await Promise.all([
    supabase
      .from('client_notifications')
      .select('id, type, reference_id, is_read, created_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('client_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('is_read', false),
  ])

  return { notifications: notifications ?? [], unreadCount: count ?? 0 }
}
