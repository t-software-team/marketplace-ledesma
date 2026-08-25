import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'
import { getProductDetail } from '@/lib/shops/queries'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { formatPrice } from '@/lib/format'
import { getBaseUrl } from '@/lib/site-url'

// 9:16 canvas that Instagram/WhatsApp stories expect. Generated on the server so
// the shared file is a branded card (photo + price + shop + QR) instead of the
// raw product photo, and so we never hit browser CORS tainting on the source image.
const WIDTH = 1080
const HEIGHT = 1920

interface StoryImageRouteProps {
  params: Promise<{ id: string }>
}

// Loads the product and bakes the QR (story links aren't tappable, so the QR is
// how the viewer gets back to the product). Returns null when the product can't
// be shown; throws are handled by the caller.
async function loadStoryData(id: string) {
  const product = await getProductDetail(id)

  if (!product || !product.isActive || !product.shop) {
    return null
  }

  const qrDataUrl = await QRCode.toDataURL(`${getBaseUrl()}/producto/${product.id}`, {
    margin: 1,
    width: 240,
    color: { dark: '#18181b', light: '#ffffff' },
  })

  return { product, shop: product.shop, qrDataUrl }
}

export async function GET(_request: Request, { params }: StoryImageRouteProps) {
  const { id } = await params

  let data: Awaited<ReturnType<typeof loadStoryData>>
  try {
    data = await loadStoryData(id)
  } catch (error) {
    console.error('story-image: fallo al generar la imagen de historia', { productId: id, error })
    return new Response('No se pudo generar la imagen', { status: 500 })
  }

  if (!data) {
    return new Response('Producto no encontrado', { status: 404 })
  }

  const { product, shop, qrDataUrl } = data
  const isVerified = hasVerifiedBadge(shop)
  const storeLinkLabel = `${getBaseUrl()}/tienda/${shop.slug}`.replace(/^https?:\/\//, '')
  const productImage = product.images[0]?.url ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f0b1a',
        }}
      >
        {/* Product photo — top ~66% of the canvas */}
        <div style={{ display: 'flex', width: '100%', height: 1270, position: 'relative' }}>
          {productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImage}
              alt=""
              width={WIDTH}
              height={1270}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1c1530',
                color: '#a78bfa',
                fontSize: 48,
                fontWeight: 700,
              }}
            >
              {shop.name}
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background: 'linear-gradient(to bottom, transparent 65%, #0f0b1a 100%)',
            }}
          />
        </div>

        {/* Info card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '40px 64px 56px',
            gap: 20,
          }}
        >
          {/* Shop row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logo_url}
                alt=""
                width={64}
                height={64}
                style={{ width: 64, height: 64, borderRadius: 999, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#7c3aed',
                  color: '#faf5ff',
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                {shop.name.charAt(0)}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 600, color: '#ffffff' }}>{shop.name}</span>
              {isVerified && (
                <span style={{ display: 'flex', fontSize: 30, color: '#a78bfa' }}>✔</span>
              )}
            </div>
          </div>

          {/* Title + price grouped together */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{
                display: 'flex',
                fontSize: 54,
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#ffffff',
              }}
            >
              {product.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              {product.variants.length > 0 && (
                <span style={{ fontSize: 28, color: '#a78bfa', fontWeight: 500 }}>Desde</span>
              )}
              <span style={{ fontSize: 72, fontWeight: 700, color: '#ffffff' }}>
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
          </div>

          {/* Footer: QR + store link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 'auto' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt=""
              width={150}
              height={150}
              style={{ width: 150, height: 150, borderRadius: 18, background: '#ffffff' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 24, color: '#c4b5fd' }}>Escaneá o visitá</span>
              <span style={{ fontSize: 30, fontWeight: 600, color: '#ffffff' }}>
                {storeLinkLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  )
}
