import Link from 'next/link'
import { createElement } from 'react'
import { ArrowRight } from 'lucide-react'
import { ProductImage } from '@/components/shared/product-image'
import { LandingBannerSection } from '@/components/shop/landing-sections'
import { ShopProductGrid, type ShopProductItem } from '@/components/shop/shop-product-grid'
import { getRubroIcon } from '@/lib/category-icons'
import { formatPrice } from '@/lib/format'

interface FeaturedProduct {
  id: string
  name: string
  price: number | null
  currency: string
  main_image: string | null
}

interface ShopCategory {
  id: string
  name: string
  slug: string
}

interface ShopmoreTemplateProps {
  shopId: string
  shopName: string
  landingBanner: unknown
  initialProducts: ShopProductItem[]
  featured: FeaturedProduct[]
  categories: ShopCategory[]
}

/**
 * Plantilla "Marketplace": layout tipo tienda online. Reutiliza el hero
 * (LandingBannerSection) y la grilla paginada con búsqueda (ShopProductGrid),
 * y suma círculos de categorías + una fila de destacados. Sin carrito.
 */
export function ShopmoreTemplate({
  shopId,
  shopName,
  landingBanner,
  initialProducts,
  featured,
  categories,
}: ShopmoreTemplateProps) {
  return (
    <div className="space-y-6">
      <LandingBannerSection data={landingBanner} />

      {categories.length > 0 && <ShopmoreCategories categories={categories} />}

      {featured.length > 0 && <ShopmoreFeatured products={featured} />}

      <section className="space-y-4">
        <h2 className="text-lg font-heading">Todos los productos</h2>
        <ShopProductGrid shopId={shopId} initialProducts={initialProducts} shopName={shopName} />
      </section>
    </div>
  )
}

function ShopmoreCategories({ categories }: { categories: ShopCategory[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-heading">Categorías</h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        {categories.map((category) => (
          <div key={category.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {createElement(getRubroIcon(category.slug), { className: 'size-6', 'aria-hidden': true })}
            </span>
            <span className="line-clamp-2 text-xs font-medium leading-tight text-muted-foreground">
              {category.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ShopmoreFeatured({ products }: { products: FeaturedProduct[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-heading">Destacados</h2>
        <span className="flex items-center gap-1 text-xs font-medium text-primary">
          Populares
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/producto/${product.id}`}
            className="w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-surface transition-opacity hover:opacity-80 sm:w-44"
          >
            <div className="relative aspect-square bg-muted">
              {product.main_image ? (
                <ProductImage
                  src={product.main_image}
                  alt={product.name}
                  className="object-cover"
                  sizes="176px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
              <p className="font-mono text-sm font-semibold">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
