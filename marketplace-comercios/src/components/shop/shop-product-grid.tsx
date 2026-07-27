import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'

export interface ShopProductItem {
  id: string
  name: string
  price: number | null
  currency: string
  mainImage: string | null
}

interface ShopProductGridProps {
  products: ShopProductItem[]
  shopName: string
}

export function ShopProductGrid({ products, shopName }: ShopProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {shopName} todavía no cargó productos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {products.map((product) => (
        <Link key={product.id} href={`/producto/${product.id}`} className="block">
          <Card className="overflow-hidden py-0 ring-border/60 transition-colors hover:ring-primary/30">
            <div className="relative aspect-square bg-muted">
              {product.mainImage ? (
                <Image
                  src={product.mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            <CardContent className="space-y-1 pb-4">
              <p className="line-clamp-2 font-medium leading-snug">{product.name}</p>
              <p className="font-mono text-sm">{formatPrice(product.price, product.currency)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
