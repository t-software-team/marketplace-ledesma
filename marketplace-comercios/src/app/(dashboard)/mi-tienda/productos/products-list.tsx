'use client'

import Image from 'next/image'
import { Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import { ProductRowActions } from './product-row-actions'

interface Product {
  id: string
  name: string
  price: number | null
  currency: string
  is_active: boolean
  is_featured: boolean
  mainImage: string | null
  categoryName: string | null
}

function formatPrice(price: number | null, currency: string) {
  if (price == null) return 'Consultar'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export function ProductsList({
  products,
  noun = 'producto',
  canFeature = false,
}: {
  products: Product[]
  noun?: string
  canFeature?: boolean
}) {
  const [query, setQuery] = useState('')

  const activeCount = products.filter((product) => product.is_active).length

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return products
    return products.filter((product) => product.name.toLowerCase().includes(normalized))
  }, [products, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {products.length} {noun}
          {products.length === 1 ? '' : 's'} · {activeCount} activo
          {activeCount === 1 ? '' : 's'}
        </p>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${noun}...`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            aria-label={`Buscar ${noun}`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No encontramos {noun}s que coincidan con &quot;{query}&quot;.
        </p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className={cn(
                'py-0 transition-shadow',
                !product.is_active && 'opacity-60',
                product.is_featured && 'ring-2 ring-primary shadow-sm shadow-primary/15'
              )}
            >
              <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-16">
                    {product.mainImage ? (
                      <Image
                        src={product.mainImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                    {product.is_featured && (
                      <span className="absolute top-1 left-1 flex size-4.5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/30">
                        <Star className="size-2.5 fill-current" aria-hidden />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1 sm:hidden">
                    <p className="truncate text-sm font-medium leading-snug">{product.name}</p>
                    <p className="font-mono text-base font-semibold text-foreground">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>

                  <div className="hidden min-w-0 flex-1 space-y-1 sm:block">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:flex-1 sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <StatusBadge
                      status={product.is_active ? 'active' : 'none'}
                      label={product.is_active ? 'Activo' : 'Inactivo'}
                    />
                    {product.is_featured && (
                      <Badge className="gap-1">
                        <Star className="size-2.5 fill-current" aria-hidden />
                        Destacado
                      </Badge>
                    )}
                    {product.categoryName && (
                      <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                        {product.categoryName}
                      </span>
                    )}
                  </div>

                  <ProductRowActions
                    productId={product.id}
                    isActive={product.is_active}
                    isFeatured={product.is_featured}
                    canFeature={canFeature}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
