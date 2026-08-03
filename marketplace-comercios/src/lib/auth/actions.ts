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

export async function selectUserRole(role: UserRole) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado' }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id)

  if (error) {
    console.error('selectUserRole: failed to update profile role', error)
    return { error: 'No pudimos guardar tu elección. Intentá de nuevo.' }
  }

  if (role === 'client' && user.email) {
    const { subject, html } = clientWelcomeEmail()
    await sendEmail(user.email, subject, html)
  }

  return { error: null }
}
