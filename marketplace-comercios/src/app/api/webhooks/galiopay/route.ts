import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { syncGalioPaySubscription } from '@/lib/galiopay/sync'

interface GalioPayWebhookPayload {
  id: string
  status: string
  referenceId: string
}

export async function POST(request: Request) {
  let payload: GalioPayWebhookPayload

  try {
    payload = await request.json()
  } catch (error) {
    console.error('galiopay webhook: body no es JSON válido', { error })
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  if (!payload.referenceId) {
    return NextResponse.json({ error: 'missing referenceId' }, { status: 400 })
  }

  const service = createServiceRoleClient()

  const { data: subscription } = await service
    .from('subscriptions')
    .select('id, status, galiopay_link_id, galiopay_proof_token')
    .eq('galiopay_reference_id', payload.referenceId)
    .maybeSingle()

  if (!subscription) {
    return NextResponse.json({ error: 'subscription not found' }, { status: 404 })
  }

  if (subscription.status === 'active') {
    return NextResponse.json({ ok: true, alreadyActive: true })
  }

  if (!subscription.galiopay_link_id || !subscription.galiopay_proof_token) {
    return NextResponse.json({ error: 'missing payment link data' }, { status: 409 })
  }

  try {
    const result = await syncGalioPaySubscription(
      subscription.id,
      subscription.galiopay_link_id,
      subscription.galiopay_proof_token
    )

    return NextResponse.json({ ok: true, activated: result.activated })
  } catch (error) {
    console.error('galiopay webhook: fallo al sincronizar suscripción', {
      subscriptionId: subscription.id,
      referenceId: payload.referenceId,
      error,
    })
    return NextResponse.json({ error: 'sync failed' }, { status: 500 })
  }
}
