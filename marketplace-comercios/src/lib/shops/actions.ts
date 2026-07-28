'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createPaymentLink } from '@/lib/galiopay/client'
import { syncGalioPaySubscription } from '@/lib/galiopay/sync'
import { getProductLimitInfo } from '@/lib/shops/queries'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  createShopSchema,
  productSchema,
  reportShopSchema,
  shopReviewSchema,
  shopSettingsSchema,
} from '@/lib/validations/shop'

export type ActionState = {
  error: string | null
  warning?: string | null
  fieldErrors?: Record<string, string>
}

function buildFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  return { supabase, user }
}

async function geocodeAddress(address: string, city: string) {
  const query = [address, city, 'Argentina'].filter(Boolean).join(', ')

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'marketplace-ledesma/1.0 (contacto@ledesma.test)',
        'Accept-Language': 'es',
      },
    })

    if (!response.ok) return null

    const results = (await response.json()) as Array<{ lat: string; lon: string }>
    const first = results[0]
    if (!first) return null

    return { lat: Number(first.lat), lng: Number(first.lon) }
  } catch (error) {
    console.error('geocodeAddress: fallo al consultar Nominatim', { address, city, error })
    return null
  }
}

export async function createShop(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser()

  const parsed = createShopSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    whatsapp_number: formData.get('whatsapp_number'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { error } = await supabase.from('shops').insert({
    owner_id: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    whatsapp_number: parsed.data.whatsapp_number,
  })

  if (error) {
    console.error('createShop: fallo al crear tienda', { error })
    return {
      error:
        error.code === '23505'
          ? 'Esa URL ya está en uso, elegí otra'
          : 'No pudimos crear la tienda',
    }
  }

  revalidatePath('/mi-tienda')
  redirect('/mi-tienda')
}

export async function updateShopSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser()

  const parsed = shopSettingsSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    whatsapp_number: formData.get('whatsapp_number'),
    email: formData.get('email') ?? '',
    address: formData.get('address') ?? '',
    city: formData.get('city') ?? '',
    category_id: formData.get('category_id') ?? '',
    instagram_url: formData.get('instagram_url') ?? '',
    facebook_url: formData.get('facebook_url') ?? '',
    website_url: formData.get('website_url') ?? '',
    business_hours_text: formData.get('business_hours_text') ?? '',
    is_paused: formData.get('is_paused') === 'on',
    paused_reason: formData.get('paused_reason') ?? '',
    logo_url: formData.get('logo_url') ?? '',
    cover_url: formData.get('cover_url') ?? '',
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos marcados',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  let businessHours: unknown = null
  if (parsed.data.business_hours_text) {
    try {
      businessHours = JSON.parse(parsed.data.business_hours_text)
    } catch (error) {
      console.error('updateShopSettings: business_hours_text inválido', { error })
      return { error: 'El horario debe ser un JSON válido' }
    }
  }

  const { data: currentShop } = await supabase
    .from('shops')
    .select('id, address, city, category_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('shops')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      whatsapp_number: parsed.data.whatsapp_number,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      category_id: parsed.data.category_id || null,
      instagram_url: parsed.data.instagram_url || null,
      facebook_url: parsed.data.facebook_url || null,
      website_url: parsed.data.website_url || null,
      business_hours: businessHours as never,
      is_paused: parsed.data.is_paused,
      paused_reason: parsed.data.is_paused ? parsed.data.paused_reason || null : null,
      logo_url: parsed.data.logo_url || null,
      cover_url: parsed.data.cover_url || null,
    })
    .eq('owner_id', user.id)

  if (error) {
    console.error('updateShopSettings: fallo al guardar cambios', { error })
    return {
      error:
        error.code === '23505'
          ? 'Esa URL ya está en uso, elegí otra'
          : 'No pudimos guardar los cambios',
    }
  }

  const addressChanged =
    currentShop &&
    (currentShop.address !== (parsed.data.address || null) ||
      currentShop.city !== (parsed.data.city || null))

  if (currentShop && addressChanged && parsed.data.address) {
    const coords = await geocodeAddress(parsed.data.address, parsed.data.city || '')

    if (coords) {
      const { error: locationError } = await supabase.rpc('set_shop_location', {
        p_shop_id: currentShop.id,
        p_lat: coords.lat,
        p_lng: coords.lng,
      })

      if (locationError) {
        console.error('updateShopSettings: fallo al setear ubicación (best effort)', {
          shopId: currentShop.id,
          error: locationError,
        })
      }
    }
  }

  let warning: string | null = null
  const newCategoryId = parsed.data.category_id || null
  const categoryChanged = currentShop && currentShop.category_id !== newCategoryId

  if (currentShop && categoryChanged) {
    const { data: orphanedProducts } = await supabase
      .from('products')
      .select('id, category_id')
      .eq('shop_id', currentShop.id)
      .not('category_id', 'is', null)

    const staleIds = (orphanedProducts ?? []).filter(
      (product) => product.category_id !== null
    )

    if (staleIds.length > 0) {
      const { data: validSubcategories } = newCategoryId
        ? await supabase.from('categories').select('id').eq('parent_id', newCategoryId)
        : { data: [] }

      const validIds = new Set((validSubcategories ?? []).map((c) => c.id))
      const toReset = staleIds.filter((product) => !validIds.has(product.category_id!))

      if (toReset.length > 0) {
        await supabase
          .from('products')
          .update({ category_id: null })
          .in(
            'id',
            toReset.map((product) => product.id)
          )

        warning = `Cambiaste el rubro del comercio: le quitamos la subcategoría a ${toReset.length} producto${toReset.length > 1 ? 's' : ''} porque ya no correspondía. Volvé a asignarles una desde "Productos".`
      }
    }
  }

  revalidatePath('/mi-tienda/configuracion')
  revalidatePath('/mi-tienda')
  revalidatePath('/mi-tienda/productos')
  return { error: null, warning }
}

export async function updateVerificationDocument(documentPath: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('shops')
    .update({ verification_document_url: documentPath })
    .eq('owner_id', user.id)

  if (error) {
    console.error('updateVerificationDocument: fallo al guardar el documento', { error })
    return { error: 'No pudimos guardar el documento' }
  }

  revalidatePath('/mi-tienda/configuracion')
  return { error: null }
}

export async function createProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser()

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!shop) return { error: 'No tenés una tienda creada' }

  const limitInfo = await getProductLimitInfo(shop.id)
  if (limitInfo.reached) {
    return {
      error: `Llegaste al límite de ${limitInfo.max} productos/servicios de tu plan actual. Mejorá tu suscripción para cargar más.`,
    }
  }

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price') ?? '',
    currency: formData.get('currency') || 'ARS',
    category_id: formData.get('category_id') ?? '',
    is_active: formData.get('is_active') === 'on',
    image_urls: formData.get('image_urls') ?? '',
    video_url: formData.get('video_url') ?? '',
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos marcados',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      shop_id: shop.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price ? Number(parsed.data.price) : null,
      currency: parsed.data.currency,
      category_id: parsed.data.category_id || null,
      is_active: parsed.data.is_active,
      video_url: parsed.data.video_url || null,
    })
    .select('id')
    .single()

  if (error || !product) {
    return { error: 'No pudimos crear el producto' }
  }

  if (parsed.data.image_urls.length > 0) {
    const { error: imagesError } = await supabase.from('product_images').insert(
      parsed.data.image_urls.map((url, index) => ({
        product_id: product.id,
        url,
        sort_order: index,
      }))
    )

    if (imagesError) {
      console.error('createProduct: fallo al guardar imágenes', {
        productId: product.id,
        error: imagesError,
      })
      return { error: 'El producto se creó, pero no pudimos guardar las imágenes' }
    }
  }

  revalidatePath('/mi-tienda/productos')
  redirect('/mi-tienda/productos?saved=created')
}

export async function updateProduct(
  productId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser()

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    price: formData.get('price') ?? '',
    currency: formData.get('currency') || 'ARS',
    category_id: formData.get('category_id') ?? '',
    is_active: formData.get('is_active') === 'on',
    image_urls: formData.get('image_urls') ?? '',
    video_url: formData.get('video_url') ?? '',
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Revisá los campos marcados',
      fieldErrors: buildFieldErrors(parsed.error),
    }
  }

  const { error } = await supabase
    .from('products')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price ? Number(parsed.data.price) : null,
      currency: parsed.data.currency,
      category_id: parsed.data.category_id || null,
      is_active: parsed.data.is_active,
      video_url: parsed.data.video_url || null,
    })
    .eq('id', productId)

  if (error) {
    return { error: 'No pudimos actualizar el producto' }
  }

  const { error: deleteImagesError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)

  if (deleteImagesError) {
    console.error('updateProduct: fallo al borrar imágenes previas', {
      productId,
      error: deleteImagesError,
    })
    return { error: 'No pudimos actualizar las imágenes del producto' }
  }

  if (parsed.data.image_urls.length > 0) {
    const { error: imagesError } = await supabase.from('product_images').insert(
      parsed.data.image_urls.map((url, index) => ({
        product_id: productId,
        url,
        sort_order: index,
      }))
    )

    if (imagesError) {
      console.error('updateProduct: fallo al guardar imágenes', { productId, error: imagesError })
      return { error: 'No pudimos guardar las imágenes del producto' }
    }
  }

  revalidatePath('/mi-tienda/productos')
  redirect('/mi-tienda/productos?saved=updated')
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireUser()

  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) {
    console.error('deleteProduct: fallo al borrar producto', { productId, error })
    throw new Error('No pudimos eliminar el producto')
  }

  revalidatePath('/mi-tienda/productos')
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)

  if (error) {
    console.error('toggleProductActive: fallo al actualizar producto', { productId, error })
    throw new Error('No pudimos actualizar el producto')
  }

  revalidatePath('/mi-tienda/productos')
}

export async function toggleProductFeatured(productId: string, isFeatured: boolean) {
  const { supabase, user } = await requireUser()

  if (isFeatured) {
    const { data: product } = await supabase
      .from('products')
      .select('shop_id')
      .eq('id', productId)
      .maybeSingle()

    if (!product) throw new Error('Producto no encontrado')

    const { data: shop } = await supabase
      .from('shops')
      .select('subscription_status')
      .eq('id', product.shop_id)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (shop?.subscription_status !== 'active') {
      throw new Error('Necesitás una suscripción activa para destacar productos')
    }
  }

  const { error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', productId)

  if (error) {
    console.error('toggleProductFeatured: fallo al actualizar producto', { productId, error })
    throw new Error('No pudimos actualizar el producto')
  }

  revalidatePath('/mi-tienda/productos')
  revalidatePath('/')
}

export async function startSubscriptionCheckout(planId: string) {
  const { supabase, user } = await requireUser()

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!shop) throw new Error('No tenés una tienda creada')

  const { data: pending } = await supabase
    .from('subscriptions')
    .select('id, galiopay_link_id, galiopay_proof_token, galiopay_checkout_url')
    .eq('shop_id', shop.id)
    .eq('status', 'pending')
    .not('galiopay_checkout_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pending?.galiopay_link_id && pending.galiopay_proof_token) {
    let activated = false

    try {
      const result = await syncGalioPaySubscription(
        pending.id,
        pending.galiopay_link_id,
        pending.galiopay_proof_token
      )
      activated = result.activated
    } catch (error) {
      console.error('startSubscriptionCheckout: fallo al verificar pago pendiente', {
        subscriptionId: pending.id,
        error,
      })
    }

    if (activated) {
      revalidatePath('/mi-tienda')
      redirect('/mi-tienda?subscription=activada')
    }

    if (pending.galiopay_checkout_url) {
      redirect(pending.galiopay_checkout_url)
    }
  }

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id, name, price, duration_days')
    .eq('id', planId)
    .maybeSingle()

  if (!plan) throw new Error('El plan seleccionado no existe')

  const endDate = new Date()
  endDate.setDate(endDate.getDate() + plan.duration_days)

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const origin = `${protocol}://${host}`

  const referenceId = `sub-${shop.id}-${crypto.randomUUID()}`

  const link = await createPaymentLink({
    items: [
      {
        title: `Plan ${plan.name} — Todo Marketplace`,
        quantity: 1,
        unitPrice: plan.price,
        currencyId: 'ARS',
      },
    ],
    referenceId,
    backUrl: {
      success: `${origin}/mi-tienda/suscripcion?status=success`,
      failure: `${origin}/mi-tienda/suscripcion?status=failure`,
    },
    notificationUrl: `${origin}/api/webhooks/galiopay`,
  })

  const { error } = await supabase.from('subscriptions').insert({
    shop_id: shop.id,
    plan_id: planId,
    status: 'pending',
    start_date: null,
    end_date: endDate.toISOString(),
    galiopay_reference_id: referenceId,
    galiopay_link_id: link.linkId,
    galiopay_proof_token: link.proofToken,
    galiopay_checkout_url: link.url,
    galiopay_status: 'pending',
  })

  if (error) {
    console.error('startSubscriptionCheckout: fallo al crear solicitud', { referenceId, error })
    throw new Error('No pudimos iniciar el pago')
  }

  revalidatePath('/mi-tienda/suscripcion')
  redirect(link.url)
}

export async function toggleFavorite(productId: string) {
  const { supabase, user } = await requireUser()

  const { data: existing } = await supabase
    .from('favorites')
    .select('client_id, product_id')
    .eq('client_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('client_id', user.id)
      .eq('product_id', productId)

    if (error) {
      console.error('toggleFavorite: fallo al quitar favorito', { productId, error })
      throw new Error('No pudimos actualizar tus favoritos')
    }
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ client_id: user.id, product_id: productId })

    if (error) {
      console.error('toggleFavorite: fallo al guardar favorito', { productId, error })
      throw new Error('No pudimos actualizar tus favoritos')
    }
  }

  revalidatePath('/favoritos')
  revalidatePath(`/producto/${productId}`)

  return { isFavorite: !existing }
}

export async function reportShop(
  shopId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = reportShopSchema.safeParse({
    reason: formData.get('reason'),
    comment: formData.get('comment') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const allowed = await checkRateLimit('report_shop', 5, 60 * 60)
  if (!allowed) {
    return { error: 'Enviaste muchos reportes. Esperá un rato antes de enviar otro.' }
  }

  const { error } = await supabase.from('shop_reports').insert({
    shop_id: shopId,
    reason: parsed.data.reason,
    comment: parsed.data.comment || null,
    reported_by: user?.id ?? null,
  })

  if (error) {
    console.error('reportShop: fallo al crear reporte', { shopId, error })
    return { error: 'No pudimos enviar tu reporte' }
  }

  return { error: null }
}

export async function upsertShopReview(
  shopId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser()

  const parsed = shopReviewSchema.safeParse({
    rating: formData.get('rating'),
    comment: formData.get('comment') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const allowed = await checkRateLimit('shop_review', 20, 60 * 60)
  if (!allowed) {
    return { error: 'Hiciste muchos cambios de reseñas. Esperá un rato antes de seguir.' }
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('slug, subscription_status')
    .eq('id', shopId)
    .maybeSingle()

  if (shop?.subscription_status !== 'active') {
    return { error: 'Este comercio no tiene las reseñas habilitadas' }
  }

  const { error } = await supabase.from('shop_reviews').upsert(
    {
      shop_id: shopId,
      client_id: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    { onConflict: 'shop_id,client_id' }
  )

  if (error) {
    console.error('upsertShopReview: fallo al guardar reseña', { shopId, error })
    return { error: 'No pudimos guardar tu reseña' }
  }

  revalidatePath(`/tienda/${shop.slug}`)
  return { error: null }
}

export async function deleteShopReview(shopId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('shop_reviews')
    .delete()
    .eq('shop_id', shopId)
    .eq('client_id', user.id)

  if (error) {
    console.error('deleteShopReview: fallo al borrar reseña', { shopId, error })
    throw new Error('No pudimos borrar tu reseña')
  }

  const { data: shop } = await supabase.from('shops').select('slug').eq('id', shopId).maybeSingle()
  if (shop) revalidatePath(`/tienda/${shop.slug}`)
}

export async function toggleShopFollow(shopId: string) {
  const { supabase, user } = await requireUser()

  const { data: existing } = await supabase
    .from('shop_follows')
    .select('id')
    .eq('shop_id', shopId)
    .eq('client_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('shop_follows')
      .delete()
      .eq('shop_id', shopId)
      .eq('client_id', user.id)

    if (error) {
      console.error('toggleShopFollow: fallo al dejar de seguir', { shopId, error })
      throw new Error('No pudimos actualizar')
    }
  } else {
    const { error } = await supabase
      .from('shop_follows')
      .insert({ shop_id: shopId, client_id: user.id })

    if (error) {
      console.error('toggleShopFollow: fallo al seguir', { shopId, error })
      throw new Error('No pudimos actualizar')
    }
  }

  const { data: shop } = await supabase.from('shops').select('slug').eq('id', shopId).maybeSingle()
  if (shop) revalidatePath(`/tienda/${shop.slug}`)
  revalidatePath('/siguiendo')

  return { isFollowing: !existing }
}

export async function logShopContact(shopId: string, productId?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase.from('shop_contacts').insert({
    shop_id: shopId,
    client_id: user.id,
    product_id: productId || null,
  })

  if (error) {
    console.error('logShopContact: fallo al registrar contacto', { shopId, error })
  }
}
