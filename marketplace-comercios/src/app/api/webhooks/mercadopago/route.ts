import { timingSafeEqual, createHmac } from 'node:crypto'
import { NextResponse } from 'next/server'
import { syncMercadoPagoSubscription } from '@/lib/mercadopago/sync'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60

// Manifest exacto documentado por Mercado Pago:
// id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
// (data.id en minúsculas, y cualquier campo ausente se omite del manifest)
function isValidSignature(dataId: string | null, requestId: string | null, xSignature: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('mercadopago webhook: MERCADOPAGO_WEBHOOK_SECRET no está configurada')
    return false
  }

  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key?.trim(), value?.trim()]
    })
  )

  const ts = parts.ts
  const receivedSignature = parts.v1
  if (!ts || !receivedSignature) return false

  const timestampSeconds = Number(ts) / 1000
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TIMESTAMP_SKEW_SECONDS
  ) {
    return false
  }

  let manifest = ''
  if (dataId) manifest += `id:${dataId.toLowerCase()};`
  if (requestId) manifest += `request-id:${requestId};`
  manifest += `ts:${ts};`

  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  const receivedBuffer = Buffer.from(receivedSignature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (receivedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(receivedBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const dataId = url.searchParams.get('data.id')
  const requestId = request.headers.get('x-request-id')
  const xSignature = request.headers.get('x-signature')

  if (!xSignature) {
    return NextResponse.json({ error: 'missing signature header' }, { status: 401 })
  }

  if (!isValidSignature(dataId, requestId, xSignature)) {
    console.error('mercadopago webhook: firma inválida')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const allowed = await checkRateLimit('mercadopago_webhook', 60, 60)
  if (!allowed) {
    console.error('mercadopago webhook: rate limit excedido')
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 })
  }

  const rawBody = await request.text()

  let payload: { type?: string; data?: { id?: string } }
  try {
    payload = JSON.parse(rawBody)
  } catch (error) {
    console.error('mercadopago webhook: body no es JSON válido', { error })
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const paymentId = payload.data?.id ?? dataId

  if (payload.type !== 'payment' || !paymentId) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  try {
    const result = await syncMercadoPagoSubscription(paymentId)

    if (!result.found) {
      return NextResponse.json({ error: 'subscription not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, activated: result.activated })
  } catch (error) {
    console.error('mercadopago webhook: fallo al sincronizar suscripción', { paymentId, error })
    return NextResponse.json({ error: 'sync failed' }, { status: 500 })
  }
}
