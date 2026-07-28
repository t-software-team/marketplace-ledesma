'use client'

import Image from 'next/image'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
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
}: {
  products: Product[]
  noun?: string
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
        <div className="space-y-3">
          {filtered.map((product) => (
            <Card key={product.id} className={cn(!product.is_active && 'opacity-60')}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {product.mainImage ? (
                      <Image
                        src={product.mainImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {formatPrice(product.price, product.currency)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge
                        status={product.is_active ? 'active' : 'none'}
                        label={product.is_active ? 'Activo' : 'Inactivo'}
                      />
                      {product.categoryName && (
                        <span className="text-xs text-muted-foreground">
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ProductRowActions productId={product.id} isActive={product.is_active} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
