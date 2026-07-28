'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markClientNotificationsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase.rpc('mark_client_notifications_read')

  if (error) {
    console.error('markClientNotificationsRead: fallo al marcar como leídas', { error })
    return
  }

  revalidatePath('/')
}
