'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { getMyGymAccess } from '@/lib/gym/queries'
import { sendEmail } from '@/lib/email/client'
import { gymStaffInviteEmail } from '@/lib/email/templates'
import type { ActionState } from './actions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Owner-only: invites someone to work at the gym by email. They get their
 * own login; the invite only becomes real access once they accept it (see
 * acceptGymStaffInvite) — inviting alone grants nothing.
 */
export async function inviteGymStaff(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getMyGymAccess()
  if (!access) return { error: 'No tenés un comercio creado' }
  if (access.role !== 'owner') return { error: 'Esta acción es solo para el dueño del gimnasio' }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { error: 'Ingresá un email válido' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: invite, error } = await supabase
    .from('shop_staff')
    .insert({ shop_id: access.shopId, invited_email: email, invited_by: user.id })
    .select('invite_token')
    .single()

  if (error || !invite) {
    // unique_violation: an invite (pending, active, or revoked) already
    // exists for this email at this shop.
    if (error?.code === '23505') {
      return { error: 'Ya existe una invitación para ese email en este gimnasio' }
    }
    console.error('inviteGymStaff: fallo al crear la invitación', { shopId: access.shopId, error })
    return { error: 'No pudimos enviar la invitación' }
  }

  const { subject, html } = gymStaffInviteEmail(access.shopName, invite.invite_token)
  await sendEmail(email, subject, html)

  revalidatePath('/mi-tienda/equipo')
  return { error: null }
}

/** Owner-only: cuts access. Does not delete history (check-ins, payments the
 * staff member recorded stay attributed to them). */
export async function revokeGymStaff(staffId: string): Promise<ActionState> {
  const access = await getMyGymAccess()
  if (!access) return { error: 'No tenés un comercio creado' }
  if (access.role !== 'owner') return { error: 'Esta acción es solo para el dueño del gimnasio' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('shop_staff')
    .update({ status: 'revoked' })
    .eq('id', staffId)
    .eq('shop_id', access.shopId)

  if (error) {
    console.error('revokeGymStaff: fallo al revocar acceso', { staffId, error })
    return { error: 'No pudimos revocar el acceso' }
  }

  revalidatePath('/mi-tienda/equipo')
  return { error: null }
}

export type AcceptInviteResult = { error: string | null; shopName?: string }

/**
 * Called by the invited person once logged in. The token is the only bearer
 * secret (same trust model as the gym's public self check-in token) — a
 * pending invite has no user_id yet, so the invited user can't read/update
 * their own row under normal RLS; the service role resolves and completes it
 * here, after independently confirming the logged-in email matches the one
 * invited (so a leaked/forwarded link can't be claimed by someone else).
 */
export async function acceptGymStaffInvite(token: string): Promise<AcceptInviteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'No autenticado' }

  const service = createServiceRoleClient()
  const { data: invite } = await service
    .from('shop_staff')
    .select('id, shop_id, invited_email, status, shops ( name )')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invite || invite.status !== 'pending') {
    return { error: 'Esta invitación no es válida o ya fue usada' }
  }

  if (invite.invited_email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      error: `Esta invitación es para ${invite.invited_email}. Iniciá sesión con ese email para aceptarla.`,
    }
  }

  const { error: staffError } = await service
    .from('shop_staff')
    .update({ user_id: user.id, status: 'active', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (staffError) {
    console.error('acceptGymStaffInvite: fallo al activar el acceso', { inviteId: invite.id, error: staffError })
    return { error: 'No pudimos activar tu acceso. Probá de nuevo.' }
  }

  // Never downgrade an existing superadmin/shop_admin; only lift a fresh
  // 'client' (or no role yet) so they can reach /mi-tienda.
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.role || profile.role === 'client') {
    const { error: profileError } = await service
      .from('profiles')
      .update({ role: 'shop_admin' })
      .eq('id', user.id)

    if (profileError) {
      console.error('acceptGymStaffInvite: fallo al actualizar el rol', { userId: user.id, error: profileError })
    }
  }

  const shop = invite.shops as { name: string } | null
  revalidatePath('/mi-tienda')
  return { error: null, shopName: shop?.name }
}

export async function acceptGymStaffInviteAndRedirect(token: string) {
  const result = await acceptGymStaffInvite(token)
  if (result.error) return result
  redirect('/mi-tienda/ingresos?bienvenida=1')
}

export type InvitePreview =
  | { status: 'invalid' }
  | { status: 'pending'; shopName: string; invitedEmail: string }

/** Read-only lookup for the invite-accept page — shows what's being accepted
 * before the person commits, without mutating anything. */
export async function getGymStaffInvitePreview(token: string): Promise<InvitePreview> {
  const service = createServiceRoleClient()
  const { data: invite } = await service
    .from('shop_staff')
    .select('status, invited_email, shops ( name )')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invite || invite.status !== 'pending') return { status: 'invalid' }

  const shop = invite.shops as { name: string } | null
  if (!shop) return { status: 'invalid' }

  return { status: 'pending', shopName: shop.name, invitedEmail: invite.invited_email }
}
