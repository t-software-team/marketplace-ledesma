interface GalioPayItem {
  title: string
  quantity: number
  unitPrice: number
  currencyId: string
  imageUrl?: string
}

interface CreatePaymentLinkParams {
  items: GalioPayItem[]
  referenceId: string
  backUrl?: { success?: string; failure?: string }
  notificationUrl?: string
}

interface PaymentLinkResponse {
  linkId: string
  url: string
  proofToken: string
  referenceId: string
  sandbox: boolean
}

function extractLinkId(url: string) {
  const path = new URL(url).pathname
  const segments = path.split('/').filter(Boolean)
  return segments[segments.length - 1]
}

interface PaymentLinkStatusResponse {
  id: string
  proofToken: string
  status: 'pending' | 'approved' | 'paid' | 'expired' | 'cancelled' | string
  items: GalioPayItem[]
  referenceId: string
  paymentId: string | null
}

function baseUrl() {
  const url = process.env.GALIOPAY_BASE_URL
  if (!url) throw new Error('GALIOPAY_BASE_URL no está configurada')
  return url
}

function authHeaders() {
  const apiKey = process.env.GALIOPAY_API_KEY
  const clientId = process.env.GALIOPAY_CLIENT_ID

  if (!apiKey || !clientId) {
    throw new Error('Credenciales de GalioPay no configuradas')
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'x-client-id': clientId,
    'Content-Type': 'application/json',
  }
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResponse> {
  const response = await fetch(`${baseUrl()}/payment-links`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      items: params.items,
      referenceId: params.referenceId,
      backUrl: params.backUrl,
      notificationUrl: params.notificationUrl,
      sandbox: process.env.GALIOPAY_SANDBOX === 'true',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GalioPay createPaymentLink falló (${response.status}): ${body}`)
  }

  const data = (await response.json()) as Omit<PaymentLinkResponse, 'linkId'>

  return { ...data, linkId: extractLinkId(data.url) }
}

export async function getPaymentLinkStatus(
  linkId: string,
  proofToken: string
): Promise<PaymentLinkStatusResponse> {
  const response = await fetch(
    `${baseUrl()}/payment-links/${linkId}?proof=${encodeURIComponent(proofToken)}`,
    { headers: authHeaders(), cache: 'no-store' }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GalioPay getPaymentLinkStatus falló (${response.status}): ${body}`)
  }

  return response.json()
}
