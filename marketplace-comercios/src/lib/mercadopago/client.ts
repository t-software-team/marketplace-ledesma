interface MercadoPagoItem {
  title: string
  quantity: number
  unit_price: number
  currency_id: string
}

interface CreatePreferenceParams {
  items: MercadoPagoItem[]
  externalReference: string
  backUrls: { success: string; failure: string }
  notificationUrl: string
}

interface PreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point: string
}

interface PaymentResponse {
  id: number
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' | string
  external_reference: string | null
}

const BASE_URL = 'https://api.mercadopago.com'

function authHeaders() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurada')

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

export async function createPreference(params: CreatePreferenceParams): Promise<PreferenceResponse> {
  const response = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      items: params.items,
      external_reference: params.externalReference,
      back_urls: params.backUrls,
      notification_url: params.notificationUrl,
      auto_return: 'approved',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`MercadoPago createPreference falló (${response.status}): ${body}`)
  }

  return response.json()
}

export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  const response = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: authHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`MercadoPago getPayment falló (${response.status}): ${body}`)
  }

  return response.json()
}
