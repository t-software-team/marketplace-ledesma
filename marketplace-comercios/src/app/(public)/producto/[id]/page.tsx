import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { ProductContact } from '@/components/product/product-contact'
import { ProductGallery } from '@/components/product/product-gallery'
import { formatPrice } from '@/lib/format'
import { getProductDetail } from '@/lib/shops/queries'
import { createClient } from '@/lib/supabase/server'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product || !product.shop) {
    return { title: 'Producto no encontrado' }
  }

  return {
    title: `${product.name} | ${product.shop.name} | Marketplace Ledesma`,
    description: product.description ?? `${product.name} en ${product.shop.name}`,
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
  const isVerified = shop.verification_status === 'verified'

  return (
    <div className="space-y-6 pb-24">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative">
            <ProductGallery images={product.images} productName={product.name} />
            <FavoriteButton
              productId={product.id}
              initialIsFavorite={isFavorite}
              isLoggedIn={Boolean(user)}
              className="absolute top-2 right-2 z-10"
            />
          </div>

          {product.videoUrl && (
            <video
              src={product.videoUrl}
              controls
              playsInline
              preload="none"
              poster={product.images[0]?.url}
              className="aspect-[9/16] w-full max-w-xs rounded-xl border border-border bg-black"
            />
          )}
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

          <div>
            <h1 className="text-2xl font-heading">{product.name}</h1>
            <p className="mt-1 font-mono text-xl text-foreground">
              {formatPrice(product.price, product.currency)}
            </p>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <Link
            href={`/tienda/${shop.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-muted"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt={`Logo de ${shop.name}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-heading text-muted-foreground">
                  {shop.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium">{shop.name}</p>
                {isVerified && <VerifiedStamp className="size-5 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">Ver tienda</p>
            </div>
          </Link>

          <ProductContact
            shopId={shop.id}
            shopName={shop.name}
            productName={product.name}
            phoneNumber={shop.whatsapp_number}
            rubroSlug={
              product.parentCategorySlug ??
              (product.category && !product.category.parent_id ? product.category.slug : null)
            }
          />
        </div>
      </div>
    </div>
  )
}
