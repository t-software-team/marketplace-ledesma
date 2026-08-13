'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markClientNotificationsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No estás autenticado')

  const { error } = await supabase.rpc('mark_client_notifications_read')

  if (error) {
    console.error('markClientNotificationsRead: fallo al marcar como leídas', { error })
    throw new Error('No pudimos marcar las notificaciones como leídas')
  }

  revalidatePath('/')
}

export async function markClientNotificationRead(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No estás autenticado')

  const { error } = await supabase
    .from('client_notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('client_id', user.id)

  if (error) {
    console.error('markClientNotificationRead: fallo al marcar como leída', { error })
    throw new Error('No pudimos marcar la notificación como leída')
  }

  revalidatePath('/mi-tienda')
}

export async function deleteReadClientNotifications() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No estás autenticado')

  const { error } = await supabase
    .from('client_notifications')
    .delete()
    .eq('client_id', user.id)
    .eq('is_read', true)

  if (error) {
    console.error('deleteReadClientNotifications: fallo al borrar notificaciones', { error })
    throw new Error('No pudimos borrar las notificaciones leídas')
  }

  revalidatePath('/')
  revalidatePath('/mi-tienda')
  revalidatePath('/mi-tienda/notificaciones')
  revalidatePath('/notificaciones')
}

export async function deleteClientNotification(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No estás autenticado')

  const { error } = await supabase
    .from('client_notifications')
    .delete()
    .eq('id', id)
    .eq('client_id', user.id)

  if (error) {
    console.error('deleteClientNotification: fallo al borrar notificación', { error })
    throw new Error('No pudimos borrar la notificación')
  }

  revalidatePath('/mi-tienda')
  revalidatePath('/mi-tienda/notificaciones')
  revalidatePath('/notificaciones')
}
