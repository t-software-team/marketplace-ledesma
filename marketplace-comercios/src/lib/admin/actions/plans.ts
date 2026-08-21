'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sanitizeRichText } from '@/lib/sanitize-html'
import {
  subscriptionPlanSchema,
  type SubscriptionPlanFormValues,
} from '@/lib/validations/admin'
import { PLAN_LIMITS_CACHE_TAG } from '@/lib/shops/queries'
import { buildBenefitsFromForm } from '@/lib/shops/benefits'
import type { ActionState } from './shared'

// Guarda (o borra si todos los campos quedan vacíos) la fila de plan_limits
// asociada a un plan real. Se llama tras crear/editar el plan porque ahora
// el formulario es uno solo (nombre, precio, beneficios y límites juntos).
async function upsertPlanLimitsForPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
  data: Pick<
    SubscriptionPlanFormValues,
    'max_products_service' | 'max_products_product' | 'max_images' | 'max_variants'
  >
) {
  const toNullableInt = (value: string | undefined) => (value ? Number(value) : null)

  const maxProductsService = toNullableInt(data.max_products_service)
  const maxProductsProduct = toNullableInt(data.max_products_product)
  const maxImages = toNullableInt(data.max_images)
  const maxVariants = toNullableInt(data.max_variants)

  const hasAnyLimit =
    maxProductsService !== null || maxProductsProduct !== null || maxImages !== null || maxVariants !== null

  if (!hasAnyLimit) {
    const { error } = await supabase.from('plan_limits').delete().eq('plan_id', planId)
    return error
  }

  const { error } = await supabase.from('plan_limits').upsert(
    {
      plan_id: planId,
      max_products_service: maxProductsService,
      max_products_product: maxProductsProduct,
      // max_images/max_variants no son nullable en la tabla: si el admin
      // deja el campo vacío, usamos el respaldo por defecto histórico.
      max_images: maxImages ?? 5,
      max_variants: maxVariants ?? 10,
    },
    { onConflict: 'plan_id' }
  )

  return error
}

export async function createSubscriptionPlan(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = subscriptionPlanSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    duration_days: formData.get('duration_days'),
    benefits_max_products: formData.get('benefits_max_products') ?? '',
    benefits_max_videos: formData.get('benefits_max_videos') ?? '',
    benefits_featured: formData.get('benefits_featured') === 'on',
    benefits_analytics: formData.get('benefits_analytics') === 'on',
    benefits_priority_support: formData.get('benefits_priority_support') === 'on',
    benefits_custom_branding: formData.get('benefits_custom_branding') === 'on',
    benefits_promotions: formData.get('benefits_promotions') === 'on',
    benefits_verified_badge: formData.get('benefits_verified_badge') === 'on',
    is_active: formData.get('is_active') === 'on',
    applies_to: formData.get('applies_to') || 'all',
    max_products_service: formData.get('max_products_service') ?? '',
    max_products_product: formData.get('max_products_product') ?? '',
    max_images: formData.get('max_images') ?? '',
    max_variants: formData.get('max_variants') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const benefits = buildBenefitsFromForm(parsed.data)

  const { data: created, error } = await supabase
    .from('subscription_plans')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ? sanitizeRichText(parsed.data.description) : null,
      price: Number(parsed.data.price),
      duration_days: Number(parsed.data.duration_days),
      benefits: benefits as never,
      is_active: parsed.data.is_active,
      applies_to: parsed.data.applies_to,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('createSubscriptionPlan: fallo al crear plan', { error })
    return { error: 'No pudimos crear el plan' }
  }

  const limitsError = await upsertPlanLimitsForPlan(supabase, created.id, parsed.data)

  if (limitsError) {
    console.error('createSubscriptionPlan: fallo al guardar límites', { limitsError })
    return { error: 'El plan se creó, pero no pudimos guardar sus límites' }
  }

  updateTag(PLAN_LIMITS_CACHE_TAG)
  revalidatePath('/admin/planes')
  redirect('/admin/planes?saved=created')
}

export async function updateSubscriptionPlan(
  planId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const parsed = subscriptionPlanSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    duration_days: formData.get('duration_days'),
    benefits_max_products: formData.get('benefits_max_products') ?? '',
    benefits_max_videos: formData.get('benefits_max_videos') ?? '',
    benefits_featured: formData.get('benefits_featured') === 'on',
    benefits_analytics: formData.get('benefits_analytics') === 'on',
    benefits_priority_support: formData.get('benefits_priority_support') === 'on',
    benefits_custom_branding: formData.get('benefits_custom_branding') === 'on',
    benefits_promotions: formData.get('benefits_promotions') === 'on',
    benefits_verified_badge: formData.get('benefits_verified_badge') === 'on',
    is_active: formData.get('is_active') === 'on',
    applies_to: formData.get('applies_to') || 'all',
    max_products_service: formData.get('max_products_service') ?? '',
    max_products_product: formData.get('max_products_product') ?? '',
    max_images: formData.get('max_images') ?? '',
    max_variants: formData.get('max_variants') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const benefits = buildBenefitsFromForm(parsed.data)

  const { error } = await supabase
    .from('subscription_plans')
    .update({
      name: parsed.data.name,
      description: parsed.data.description ? sanitizeRichText(parsed.data.description) : null,
      price: Number(parsed.data.price),
      duration_days: Number(parsed.data.duration_days),
      benefits: benefits as never,
      is_active: parsed.data.is_active,
      applies_to: parsed.data.applies_to,
    })
    .eq('id', planId)

  if (error) {
    console.error('updateSubscriptionPlan: fallo al actualizar plan', { planId, error })
    return { error: 'No pudimos guardar los cambios' }
  }

  const limitsError = await upsertPlanLimitsForPlan(supabase, planId, parsed.data)

  if (limitsError) {
    console.error('updateSubscriptionPlan: fallo al guardar límites', { planId, limitsError })
    return { error: 'Guardamos el plan, pero no pudimos guardar sus límites' }
  }

  updateTag(PLAN_LIMITS_CACHE_TAG)
  revalidatePath('/admin/planes')
  redirect('/admin/planes?saved=updated')
}

export async function toggleSubscriptionPlanActive(planId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('subscription_plans')
    .update({ is_active: isActive })
    .eq('id', planId)

  if (error) {
    console.error('toggleSubscriptionPlanActive: fallo al actualizar plan', { planId, error })
    throw new Error('No pudimos actualizar el plan')
  }

  revalidatePath('/admin/planes')
}

export async function deleteSubscriptionPlan(planId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('subscription_plans').delete().eq('id', planId)

  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar: hay suscripciones asociadas a este plan. Desactivalo en su lugar.')
    }
    console.error('deleteSubscriptionPlan: fallo al eliminar plan', { planId, error })
    throw new Error('No pudimos eliminar el plan')
  }

  revalidatePath('/admin/planes')
}
