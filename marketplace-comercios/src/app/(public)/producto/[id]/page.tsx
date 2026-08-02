import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { ShareButton } from '@/components/shared/share-button'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { ProductContact } from '@/components/product/product-contact'
import { ProductGallery } from '@/components/product/product-gallery'
import { formatPrice } from '@/lib/format'
import { getProductDetail } from '@/lib/shops/queries'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/site-url'
import { stripHtml } from '@/lib/strip-html'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product || !product.shop) {
    return { title: 'Producto no encontrado' }
  }

  const description = product.description
    ? stripHtml(product.description)
    : `${product.name} en ${product.shop.name}`
  const image = product.images[0]?.url

  return {
    title: `${product.name} | ${product.shop.name}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product || !product.isActive || !product.shop) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isFavorite = false
  if (user) {
    const { data: favorite } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('client_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()

    isFavorite = Boolean(favorite)
  }

  const shop = product.shop
  const isVerified = hasVerifiedBadge(shop)
  const baseUrl = getBaseUrl()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ? stripHtml(product.description) : undefined,
    image: product.images.map((image) => image.url),
    url: `${baseUrl}/producto/${product.id}`,
    offers: {
      '@type': 'Offer',
      price: product.price ?? undefined,
      priceCurrency: product.currency ?? 'ARS',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/producto/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: shop.name,
        url: `${baseUrl}/tienda/${shop.slug}`,
      },
    },
  }

  return (
    <div className="space-y-6 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative">
          <ProductGallery
            images={product.images}
            productName={product.name}
            videoUrl={product.videoUrl}
          />
          <FavoriteButton
            productId={product.id}
            initialIsFavorite={isFavorite}
            isLoggedIn={Boolean(user)}
            className="absolute top-2 right-2 z-10"
          />
        </div>

        <div className="space-y-4">
          {product.category && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {product.parentCategoryName && (
                <>
                  <span>{product.parentCategoryName}</span>
                  <ChevronRight className="size-3" />
                </>
              )}
              <span>{product.category.name}</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-heading">{product.name}</h1>
              <p className="mt-1 font-mono text-3xl font-semibold text-foreground">
                {product.variants.length > 0 && (
                  <span className="mr-1 font-sans text-sm font-normal text-muted-foreground">
                    Desde
                  </span>
                )}
                {formatPrice(product.price, product.currency)}
              </p>
            </div>
            <ShareButton
              title={product.name}
              text={`Mirá "${product.name}" en ${shop.name} — ${formatPrice(product.price, product.currency)}`}
              url={`${baseUrl}/producto/${product.id}`}
              className="shrink-0"
            />
          </div>

          {product.description && (
            // product.description is sanitized server-side (sanitizeRichText) before it's
            // ever persisted, so this is safe against stored XSS.
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground [&_p]:my-1"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {product.attributes.length > 0 && (
            <div className="space-y-2">
              {product.attributes.map((attribute) => (
                <div key={attribute.label} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{attribute.label}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {attribute.values.map((value) =>
                      attribute.type === 'multicolor' ? (
                        <span
                          key={value}
                          title={value}
                          style={{ backgroundColor: value }}
                          className="size-5 rounded-full border border-border"
                        />
                      ) : (
                        <span
                          key={value}
                          className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium"
                        >
                          {value}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/tienda/${shop.slug}`}
            className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt={`Logo de ${shop.name}`}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-heading text-muted-foreground">
                  {shop.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-base font-medium text-foreground">
                {shop.name}
                {isVerified && <VerifiedStamp className="size-4 shrink-0" />}
              </span>
              <span className="text-xs text-muted-foreground">Ir a la tienda</span>
            </div>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>

          <ProductContact
            shopId={shop.id}
            shopName={shop.name}
            productId={product.id}
            productName={product.name}
            phoneNumber={shop.whatsapp_number}
            rubroSlug={
              product.parentCategorySlug ??
              (product.category && !product.category.parent_id ? product.category.slug : null)
            }
            variants={product.variants}
            currency={product.currency}
          />
        </div>
      </div>
    </div>
  )
}
