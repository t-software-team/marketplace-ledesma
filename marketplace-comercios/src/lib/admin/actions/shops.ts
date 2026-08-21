'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { rejectionReasonSchema } from '@/lib/validations/admin'
import {
  shopReactivatedEmail,
  shopSuspendedEmail,
  shopVerificationApprovedEmail,
  shopVerificationRejectedEmail,
} from '@/lib/email/templates'
import { searchShopsByName as searchShopsByNameQuery } from '@/lib/admin/queries'
import { logAdminAction, notifyShopOwner, type ActionState } from './shared'

// Wrapper necesario (no redundante): expone la query como Server Action para
// que command-palette.tsx (client component) pueda invocarla directamente.
export async function searchShopsByName(query: string) {
  return searchShopsByNameQuery(query)
}

export async function approveShopVerification(shopId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('approve_shop_verification', {
    p_shop_id: shopId,
  })

  if (error) {
    console.error('approveShopVerification: fallo al aprobar', { shopId, error })
    throw new Error('No pudimos aprobar la verificación')
  }

  await logAdminAction(supabase, 'shop_verified', 'shops', shopId)
  await notifyShopOwner(shopId, shopVerificationApprovedEmail)

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
}

export async function rejectShopVerification(shopId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('reject_shop_verification', {
    p_shop_id: shopId,
  })

  if (error) {
    console.error('rejectShopVerification: fallo al rechazar', { shopId, error })
    throw new Error('No pudimos rechazar la verificación')
  }

  await notifyShopOwner(shopId, shopVerificationRejectedEmail)

  await logAdminAction(supabase, 'shop_verification_rejected', 'shops', shopId)

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
}

export async function suspendShop(
  shopId: string,
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

  const { error } = await supabase.rpc('suspend_shop', {
    p_shop_id: shopId,
    p_reason: parsed.data.reason,
  })

  if (error) {
    console.error('suspendShop: fallo al suspender', { shopId, error })
    return { error: 'No pudimos suspender el comercio' }
  }

  await notifyShopOwner(shopId, (shopName) => shopSuspendedEmail(shopName, parsed.data.reason))
  await logAdminAction(supabase, 'shop_suspended', 'shops', shopId, { reason: parsed.data.reason })

  revalidatePath('/')
  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
  return { error: null }
}

export async function unsuspendShop(shopId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('unsuspend_shop', { p_shop_id: shopId })

  if (error) {
    console.error('unsuspendShop: fallo al reactivar', { shopId, error })
    throw new Error('No pudimos reactivar el comercio')
  }

  await notifyShopOwner(shopId, shopReactivatedEmail)
  await logAdminAction(supabase, 'shop_unsuspended', 'shops', shopId)

  revalidatePath('/')
  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
}

export async function bulkApproveShopVerification(
  shopIds: string[]
): Promise<{ approved: number; failed: number }> {
  const supabase = await createClient()
  let approved = 0
  let failed = 0

  for (const shopId of shopIds) {
    const { error } = await supabase.rpc('approve_shop_verification', { p_shop_id: shopId })
    if (error) {
      console.error('bulkApproveShopVerification: fallo al aprobar', { shopId, error })
      failed += 1
      continue
    }
    approved += 1
    await logAdminAction(supabase, 'shop_verified', 'shops', shopId)
    await notifyShopOwner(shopId, shopVerificationApprovedEmail)
  }

  revalidatePath('/admin/shops')
  return { approved, failed }
}

export async function bulkSuspendShops(
  shopIds: string[],
  reason: string
): Promise<{ suspended: number; failed: number }> {
  const parsed = rejectionReasonSchema.safeParse({ reason })
  if (!parsed.success) {
    return { suspended: 0, failed: shopIds.length }
  }

  const supabase = await createClient()
  let suspended = 0
  let failed = 0

  for (const shopId of shopIds) {
    const { error } = await supabase.rpc('suspend_shop', {
      p_shop_id: shopId,
      p_reason: parsed.data.reason,
    })
    if (error) {
      console.error('bulkSuspendShops: fallo al suspender', { shopId, error })
      failed += 1
      continue
    }
    suspended += 1
    await notifyShopOwner(shopId, (shopName) => shopSuspendedEmail(shopName, parsed.data.reason))
    await logAdminAction(supabase, 'shop_suspended', 'shops', shopId, { reason: parsed.data.reason })
  }

  revalidatePath('/')
  revalidatePath('/admin/shops')
  return { suspended, failed }
}

export async function bulkChangeShopPlan(
  shopIds: string[],
  planId: string
): Promise<{ changed: number; failed: number }> {
  const supabase = await createClient()
  let changed = 0
  let failed = 0

  for (const shopId of shopIds) {
    const { error } = await supabase.rpc('admin_set_shop_plan', {
      p_shop_id: shopId,
      p_plan_id: planId,
    })
    if (error) {
      console.error('bulkChangeShopPlan: fallo al cambiar el plan', { shopId, planId, error })
      failed += 1
      continue
    }
    changed += 1
    await logAdminAction(supabase, 'shop_plan_changed', 'shops', shopId, { planId })
  }

  revalidatePath('/admin/shops')
  return { changed, failed }
}

export async function adminSetShopPlan(shopId: string, planId: string | null) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('admin_set_shop_plan', {
    p_shop_id: shopId,
    // admin_set_shop_plan's SQL body explicitly handles p_plan_id is null
    // (unassigns the plan), but Supabase's type generator doesn't infer
    // nullability for RPC args from the Postgres function signature.
    p_plan_id: planId as string,
  })

  if (error) {
    console.error('adminSetShopPlan: fallo al cambiar el plan', { shopId, planId, error })
    throw new Error('No pudimos cambiar el plan del comercio')
  }

  await logAdminAction(supabase, 'shop_plan_changed', 'shops', shopId, { planId })

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
}
