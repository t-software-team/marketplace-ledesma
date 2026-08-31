'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { getMyGymAccess } from '@/lib/gym/queries'
import { sendEmail } from '@/lib/email/client'
import { gymStaffInviteEmail } from '@/lib/email/templates'
import { acceptInviteSchema } from '@/lib/validations/auth'
import type { ActionState } from './actions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shared by both accept paths: flips the invite row to active and lifts a
 * fresh 'client' (or role-less) profile to 'shop_admin' — never downgrades
 * an existing superadmin/shop_admin. */
async function activateStaffInvite(
  service: SupabaseClient,
  invite: { id: string; shops: unknown },
  userId: string
) {
  const { error: staffError } = await service
    .from('shop_staff')
    .update({ user_id: userId, status: 'active', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (staffError) {
    console.error('activateStaffInvite: fallo al activar el acceso', { inviteId: invite.id, error: staffError })
    return { error: 'No pudimos activar tu acceso. Probá de nuevo.' }
  }

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role || profile.role === 'client') {
    const { error: profileError } = await service
      .from('profiles')
      .update({ role: 'shop_admin' })
      .eq('id', userId)

    if (profileError) {
      console.error('activateStaffInvite: fallo al actualizar el rol', { userId, error: profileError })
    }
  }

  const shop = invite.shops as { name: string } | null
  revalidatePath('/mi-tienda')
  return { error: null, shopName: shop?.name }
}

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

  // (shop_id, invited_email) is unique, so a second invite attempt hits that
  // constraint instead of inserting — resolve it first instead of hard-failing,
  // since re-inviting (typo'd the link, person lost the email) is the common case.
  const { data: existing } = await supabase
    .from('shop_staff')
    .select('id, status, invite_token')
    .eq('shop_id', access.shopId)
    .eq('invited_email', email)
    .maybeSingle()

  if (existing?.status === 'active') {
    return { error: 'Esa persona ya tiene acceso a este gimnasio' }
  }

  let inviteToken = existing?.invite_token as string | undefined

  if (existing) {
    // 'pending' (resend the same link) or 'revoked' (reactivate with a fresh
    // token, since the old one may have been shared/leaked before revoking).
    const nextToken = existing.status === 'revoked' ? crypto.randomUUID() : existing.invite_token
    const { error: updateError } = await supabase
      .from('shop_staff')
      .update({ status: 'pending', invite_token: nextToken, invited_by: user.id })
      .eq('id', existing.id)

    if (updateError) {
      console.error('inviteGymStaff: fallo al reenviar la invitación', { shopId: access.shopId, error: updateError })
      return { error: 'No pudimos enviar la invitación' }
    }
    inviteToken = nextToken
  } else {
    const { data: invite, error } = await supabase
      .from('shop_staff')
      .insert({ shop_id: access.shopId, invited_email: email, invited_by: user.id })
      .select('invite_token')
      .single()

    if (error || !invite) {
      console.error('inviteGymStaff: fallo al crear la invitación', { shopId: access.shopId, error })
      return { error: 'No pudimos enviar la invitación' }
    }
    inviteToken = invite.invite_token
  }

  const { subject, html } = gymStaffInviteEmail(access.shopName, inviteToken!)
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

  return activateStaffInvite(service, invite, user.id)
}

export async function acceptGymStaffInviteAndRedirect(token: string) {
  const result = await acceptGymStaffInvite(token)
  if (result.error) return result
  redirect('/mi-tienda/ingresos?bienvenida=1')
}

/**
 * For an invited email with no account yet: creates the account, activates
 * the invite and logs the person in, all in one step — no separate signup
 * confirmation email. Clicking the invite link (sent by us to invited_email)
 * already proves ownership of that inbox, so a second "confirm your email"
 * round-trip is redundant friction, not extra security.
 */
export async function acceptGymStaffInviteNewAccount(
  token: string,
  formData: FormData
): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSchema.safeParse({
    fullName: formData.get('fullName'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const { fullName, password } = parsed.data

  const service = createServiceRoleClient()
  const { data: invite } = await service
    .from('shop_staff')
    .select('id, invited_email, status, shops ( name )')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invite || invite.status !== 'pending') {
    return { error: 'Esta invitación no es válida o ya fue usada' }
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: invite.invited_email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    // Most likely: the email got an account in the meantime (another tab,
    // or they'd actually already signed up) — send them to the normal
    // login path instead of failing outright.
    console.error('acceptGymStaffInviteNewAccount: fallo al crear la cuenta', {
      inviteId: invite.id,
      error: createError,
    })
    return { error: 'Ya existe una cuenta con ese email. Iniciá sesión con tu contraseña.' }
  }

  const activation = await activateStaffInvite(service, invite, created.user.id)
  if (activation.error) return activation

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.invited_email,
    password,
  })

  if (signInError) {
    console.error('acceptGymStaffInviteNewAccount: cuenta creada pero falló el login', {
      inviteId: invite.id,
      error: signInError,
    })
    return { error: 'Tu cuenta se creó. Iniciá sesión con tu contraseña.' }
  }

  return activation
}

export async function acceptGymStaffInviteNewAccountAndRedirect(token: string, formData: FormData) {
  const result = await acceptGymStaffInviteNewAccount(token, formData)
  if (result.error) return result
  redirect('/mi-tienda/ingresos?bienvenida=1')
}

export type InvitePreview =
  | { status: 'invalid' }
  | { status: 'pending'; shopName: string; invitedEmail: string; hasAccount: boolean }

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

  const { data: hasAccount } = await service.rpc('email_has_account', {
    p_email: invite.invited_email,
  })

  return {
    status: 'pending',
    shopName: shop.name,
    invitedEmail: invite.invited_email,
    hasAccount: hasAccount ?? false,
  }
}
