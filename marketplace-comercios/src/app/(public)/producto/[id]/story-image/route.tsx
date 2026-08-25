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

export const contentType = 'image/png'

interface StoryImageRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: StoryImageRouteProps) {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product || !product.isActive || !product.shop) {
    return new Response('Producto no encontrado', { status: 404 })
  }

  const shop = product.shop
  const isVerified = hasVerifiedBadge(shop)
  const productUrl = `${getBaseUrl()}/producto/${product.id}`
  const productImage = product.images[0]?.url ?? null

  // QR baked into the image: story links aren't tappable, so this is how the
  // viewer gets back to the product.
  const qrDataUrl = await QRCode.toDataURL(productUrl, {
    margin: 1,
    width: 240,
    color: { dark: '#18181b', light: '#ffffff' },
  })

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
        {/* Product photo — top ~62% of the canvas */}
        <div style={{ display: 'flex', width: '100%', height: 1190, position: 'relative' }}>
          {productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImage}
              alt=""
              width={WIDTH}
              height={1190}
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
            padding: '48px 64px 72px',
            gap: 28,
          }}
        >
          {/* Shop row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logo_url}
                alt=""
                width={72}
                height={72}
                style={{ width: 72, height: 72, borderRadius: 999, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: 72,
                  height: 72,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#7c3aed',
                  color: '#faf5ff',
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                {shop.name.charAt(0)}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 34, fontWeight: 600, color: '#ffffff' }}>{shop.name}</span>
              {isVerified && (
                <span style={{ display: 'flex', fontSize: 32, color: '#a78bfa' }}>✔</span>
              )}
            </div>
          </div>

          {/* Product name */}
          <span
            style={{
              display: 'flex',
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.1,
              color: '#ffffff',
            }}
          >
            {product.name}
          </span>

          {/* Bottom row: price + QR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 30, color: '#a78bfa', fontWeight: 500 }}>
                {product.variants.length > 0 ? 'Desde' : 'Precio'}
              </span>
              <span style={{ fontSize: 76, fontWeight: 700, color: '#ffffff' }}>
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt=""
                width={180}
                height={180}
                style={{ width: 180, height: 180, borderRadius: 20, background: '#ffffff' }}
              />
              <span style={{ fontSize: 22, color: '#c4b5fd' }}>Escaneá para ver</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  )
}
