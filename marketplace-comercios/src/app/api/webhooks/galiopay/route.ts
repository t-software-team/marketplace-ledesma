import { timingSafeEqual, createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { syncGalioPaySubscription } from '@/lib/galiopay/sync'

interface GalioPayWebhookPayload {
  id: string
  status: string
  referenceId: string
}

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60

function isValidSignature(rawBody: string, timestamp: string, signatureHeader: string) {
  const secret = process.env.GALIOPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('galiopay webhook: GALIOPAY_WEBHOOK_SECRET no está configurada')
    return false
  }

  const received = signatureHeader.startsWith('v1=')
    ? signatureHeader.slice('v1='.length)
    : signatureHeader

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')

  const receivedBuffer = Buffer.from(received, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (receivedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(receivedBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const signature = request.headers.get('x-galiopay-signature')
  const timestamp = request.headers.get('x-galiopay-timestamp')

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'missing signature headers' }, { status: 401 })
  }

  const timestampSeconds = Number(timestamp)
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TIMESTAMP_SKEW_SECONDS
  ) {
    return NextResponse.json({ error: 'stale timestamp' }, { status: 401 })
  }

  if (!isValidSignature(rawBody, timestamp, signature)) {
    console.error('galiopay webhook: firma inválida')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: GalioPayWebhookPayload

  try {
    payload = JSON.parse(rawBody)
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
    .select('id, shop_id, status, galiopay_link_id, galiopay_proof_token')
    .eq('galiopay_reference_id', payload.referenceId)
    .maybeSingle()

  if (!subscription) {
    return NextResponse.json({ error: 'subscription not found' }, { status: 404 })
  }

  if (payload.status === 'refunded') {
    const { error } = await service
      .from('subscriptions')
      .update({ status: 'expired', galiopay_status: 'refunded' })
      .eq('id', subscription.id)

    if (error) {
      console.error('galiopay webhook: fallo al procesar reembolso', {
        subscriptionId: subscription.id,
        referenceId: payload.referenceId,
        error,
      })
      return NextResponse.json({ error: 'refund processing failed' }, { status: 500 })
    }

    if (subscription.status === 'active') {
      await service
        .from('shops')
        .update({ subscription_status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', subscription.shop_id)
    }

    return NextResponse.json({ ok: true, refunded: true })
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
