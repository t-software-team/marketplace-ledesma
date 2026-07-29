'use client'

import Image from 'next/image'
import { Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
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

const PAGE_SIZE = 15

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
  const [page, setPage] = useState(1)

  const activeCount = products.filter((product) => product.is_active).length

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return products
    return products.filter((product) => product.name.toLowerCase().includes(normalized))
  }, [products, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageProducts = filtered.slice(start, start + PAGE_SIZE)

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
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{noun.charAt(0).toUpperCase() + noun.slice(1)}</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageProducts.map((product) => (
                <TableRow key={product.id} className={!product.is_active ? 'opacity-60' : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {product.mainImage ? (
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                            Sin imagen
                          </div>
                        )}
                        {product.is_featured && (
                          <span className="absolute top-0.5 left-0.5 flex size-3.5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/30">
                            <Star className="size-2 fill-current" aria-hidden />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        {product.categoryName && (
                          <p className="truncate text-xs text-muted-foreground">
                            {product.categoryName}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono">
                    {formatPrice(product.price, product.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
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
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <ProductRowActions
                      productId={product.id}
                      isActive={product.is_active}
                      isFeatured={product.is_featured}
                      canFeature={canFeature}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            totalCount={filtered.length}
            onPrevious={() => setPage(currentPage - 1)}
            onNext={() => setPage(currentPage + 1)}
          />
        </div>
      )}
    </div>
  )
}
