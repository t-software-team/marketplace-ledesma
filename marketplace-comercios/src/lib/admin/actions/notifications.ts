'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  const { error } = await supabase.rpc('mark_all_admin_notifications_read')

  if (error) {
    console.error('markAllNotificationsRead: fallo al marcar notificaciones', { error })
    throw new Error('No pudimos marcar las notificaciones como leídas')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/shops')
  revalidatePath('/admin/subscripciones')
  revalidatePath('/admin/reportes')
}

export async function markAdminNotificationRead(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('mark_admin_notification_read', { p_id: id })

  if (error) {
    console.error('markAdminNotificationRead: fallo al marcar notificación', { error })
    throw new Error('No pudimos marcar la notificación como leída')
  }

  revalidatePath('/admin')
}

export async function deleteReadAdminNotifications() {
  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_read_admin_notifications')

  if (error) {
    console.error('deleteReadAdminNotifications: fallo al borrar notificaciones', { error })
    throw new Error('No pudimos borrar las notificaciones leídas')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/shops')
  revalidatePath('/admin/subscripciones')
  revalidatePath('/admin/reportes')
  revalidatePath('/admin/notificaciones')
}

export async function deleteAdminNotification(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_admin_notification', { p_id: id })

  if (error) {
    console.error('deleteAdminNotification: fallo al borrar notificación', { error })
    throw new Error('No pudimos borrar la notificación')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/notificaciones')
}
