'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/profile'
import type { ActionState } from '@/lib/shops/actions'

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone') ?? '',
    city: formData.get('city') ?? '',
    avatar_url: formData.get('avatar_url') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('updateProfile: fallo al guardar perfil', { error })
    return { error: 'No pudimos guardar tu perfil' }
  }

  revalidatePath('/perfil')
  return { error: null }
}
