'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { clientWelcomeEmail } from '@/lib/email/templates'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signIn(email: string, password: string, next?: string | null) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email o contraseña incorrectos' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) {
    redirect('/onboarding')
  }

  const roleDestination =
    profile.role === 'shop_admin'
      ? '/mi-tienda'
      : profile.role === 'superadmin'
        ? '/admin/dashboard'
        : '/'

  redirect(next ?? roleDestination)
}

export async function selectUserRole(role: UserRole) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado' }
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', user.id)
    .is('role', null)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('selectUserRole: failed to update profile role', error)
    return { error: 'No pudimos guardar tu elección. Intentá de nuevo.' }
  }

  if (!updated) {
    console.error('selectUserRole: no row updated (profile missing or role already set)', {
      userId: user.id,
    })
    return { error: 'No pudimos guardar tu elección. Intentá de nuevo.' }
  }

  if (role === 'client' && user.email) {
    const { subject, html } = clientWelcomeEmail()
    await sendEmail(user.email, subject, html)
  }

  redirect(role === 'shop_admin' ? '/mi-tienda' : '/')
}
