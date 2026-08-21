'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { rejectionReasonSchema } from '@/lib/validations/admin'
import { logAdminAction, requireSuperadmin, type ActionState } from './shared'

const USER_BAN_DURATION = '87600h'

export async function banUser(
  userId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = rejectionReasonSchema.safeParse({ reason: formData.get('reason') })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { supabase, currentUserId } = await requireSuperadmin()

  if (userId === currentUserId) {
    return { error: 'No podés banearte a vos mismo' }
  }

  const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', userId).single()

  if (targetProfile?.role === 'superadmin') {
    return { error: 'No podés banear a otro superadmin' }
  }

  const service = createServiceRoleClient()
  const { error } = await service.auth.admin.updateUserById(userId, { ban_duration: USER_BAN_DURATION })

  if (error) {
    console.error('banUser: fallo al banear', { userId, error })
    return { error: 'No pudimos banear al usuario' }
  }

  await logAdminAction(supabase, 'user_banned', 'profiles', userId, { reason: parsed.data.reason })

  revalidatePath('/admin/usuarios')
  return { error: null }
}

export async function unbanUser(userId: string) {
  const { supabase } = await requireSuperadmin()
  const service = createServiceRoleClient()

  const { error } = await service.auth.admin.updateUserById(userId, { ban_duration: 'none' })

  if (error) {
    console.error('unbanUser: fallo al reactivar', { userId, error })
    throw new Error('No pudimos reactivar al usuario')
  }

  await logAdminAction(supabase, 'user_unbanned', 'profiles', userId)

  revalidatePath('/admin/usuarios')
}

export async function bulkBanUsers(
  userIds: string[],
  reason: string
): Promise<{ banned: number; failed: number }> {
  const parsed = rejectionReasonSchema.safeParse({ reason })
  if (!parsed.success) {
    return { banned: 0, failed: userIds.length }
  }

  const { supabase, currentUserId } = await requireSuperadmin()

  const { data: targetProfiles } = await supabase.from('profiles').select('id, role').in('id', userIds)
  const roleById = new Map((targetProfiles ?? []).map((profile) => [profile.id, profile.role]))

  const service = createServiceRoleClient()
  let banned = 0
  let failed = 0

  for (const userId of userIds) {
    if (userId === currentUserId || roleById.get(userId) === 'superadmin') {
      failed += 1
      continue
    }

    const { error } = await service.auth.admin.updateUserById(userId, { ban_duration: USER_BAN_DURATION })
    if (error) {
      console.error('bulkBanUsers: fallo al banear', { userId, error })
      failed += 1
      continue
    }
    banned += 1
    await logAdminAction(supabase, 'user_banned', 'profiles', userId, { reason: parsed.data.reason })
  }

  revalidatePath('/admin/usuarios')
  return { banned, failed }
}

export async function bulkUnbanUsers(userIds: string[]): Promise<{ unbanned: number; failed: number }> {
  const { supabase } = await requireSuperadmin()
  const service = createServiceRoleClient()
  let unbanned = 0
  let failed = 0

  for (const userId of userIds) {
    const { error } = await service.auth.admin.updateUserById(userId, { ban_duration: 'none' })
    if (error) {
      console.error('bulkUnbanUsers: fallo al reactivar', { userId, error })
      failed += 1
      continue
    }
    unbanned += 1
    await logAdminAction(supabase, 'user_unbanned', 'profiles', userId)
  }

  revalidatePath('/admin/usuarios')
  return { unbanned, failed }
}
