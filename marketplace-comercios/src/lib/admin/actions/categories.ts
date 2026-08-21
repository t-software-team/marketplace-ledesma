'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { categorySchema, rejectionReasonSchema } from '@/lib/validations/admin'
import { logAdminAction, type ActionState } from './shared'

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    parent_id: formData.get('parent_id') ?? '',
    icon_url: formData.get('icon_url') ?? '',
    is_active: formData.get('is_active') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { error } = await supabase.from('categories').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    parent_id: parsed.data.parent_id || null,
    icon_url: parsed.data.icon_url || null,
    is_active: parsed.data.is_active,
    created_by: user?.id ?? null,
  })

  if (error) {
    console.error('createCategory: fallo al crear categoría', { error })
    return {
      error:
        error.code === '23505'
          ? 'Esa URL ya está en uso, elegí otra'
          : 'No pudimos crear la categoría',
    }
  }

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias?saved=created')
}

export async function updateCategory(
  categoryId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    parent_id: formData.get('parent_id') ?? '',
    icon_url: formData.get('icon_url') ?? '',
    is_active: formData.get('is_active') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  if (parsed.data.parent_id === categoryId) {
    return { error: 'Una categoría no puede ser su propio padre' }
  }

  const { error } = await supabase
    .from('categories')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      parent_id: parsed.data.parent_id || null,
      icon_url: parsed.data.icon_url || null,
      is_active: parsed.data.is_active,
    })
    .eq('id', categoryId)

  if (error) {
    console.error('updateCategory: fallo al actualizar categoría', { categoryId, error })
    return {
      error:
        error.code === '23505'
          ? 'Esa URL ya está en uso, elegí otra'
          : 'No pudimos guardar los cambios',
    }
  }

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias?saved=updated')
}

export async function toggleCategoryActive(categoryId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)

  if (error) {
    console.error('toggleCategoryActive: fallo al actualizar categoría', { categoryId, error })
    throw new Error('No pudimos actualizar la categoría')
  }

  revalidatePath('/admin/categorias')
}

export async function bulkToggleCategoryActive(categoryIds: string[], isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .in('id', categoryIds)

  if (error) {
    console.error('bulkToggleCategoryActive: fallo al actualizar categorías', { categoryIds, error })
    throw new Error('No pudimos actualizar las categorías seleccionadas')
  }

  revalidatePath('/admin/categorias')
}

export async function bulkDeleteCategories(
  categoryIds: string[]
): Promise<{ deleted: number; failed: number }> {
  const supabase = await createClient()
  let deleted = 0
  let failed = 0

  for (const categoryId of categoryIds) {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (error) {
      console.error('bulkDeleteCategories: fallo al borrar categoría', { categoryId, error })
      failed += 1
    } else {
      deleted += 1
    }
  }

  revalidatePath('/admin/categorias')
  return { deleted, failed }
}

export async function approveCategorySuggestion(suggestionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('approve_category_suggestion', {
    p_suggestion_id: suggestionId,
  })

  if (error) {
    console.error('approveCategorySuggestion: fallo al aprobar', { suggestionId, error })
    throw new Error('No pudimos aprobar la categoría')
  }

  await logAdminAction(supabase, 'category_suggestion_approved', 'category_suggestions', suggestionId, {
    resultingCategoryId: data,
  })

  revalidatePath('/admin/categorias')
}

export async function rejectCategorySuggestion(
  suggestionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = rejectionReasonSchema.safeParse({
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { error } = await supabase.rpc('reject_category_suggestion', {
    p_suggestion_id: suggestionId,
    p_reason: parsed.data.reason,
  })

  if (error) {
    console.error('rejectCategorySuggestion: fallo al rechazar', { suggestionId, error })
    return { error: 'No pudimos rechazar la sugerencia' }
  }

  await logAdminAction(supabase, 'category_suggestion_rejected', 'category_suggestions', suggestionId, {
    reason: parsed.data.reason,
  })

  revalidatePath('/admin/categorias')
  return { error: null }
}
