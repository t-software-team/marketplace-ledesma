'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Search, Star, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import {
  bulkDeleteProducts,
  bulkToggleProductActive,
  bulkToggleProductFeatured,
} from '@/lib/shops/actions'
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
  totalCount,
  search,
  basePath,
}: {
  products: Product[]
  noun?: string
  canFeature?: boolean
  totalCount?: number
  search?: string
  basePath?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(search ?? '')
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const activeCount = products.filter((product) => product.is_active).length
  const pageProducts = products

  function handleSearchChange(value: string) {
    setQuery(value)
    if (!basePath) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      startTransition(() => {
        router.push(params.size > 0 ? `${basePath}?${params.toString()}` : basePath)
      })
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageProducts.map((product) => product.id)
  )

  function handleBulkToggle(isActive: boolean) {
    startTransition(async () => {
      try {
        await bulkToggleProductActive(selectedIds, isActive)
        toast.add({
          title: isActive ? `${selectedIds.length} ${noun}s activados` : `${selectedIds.length} ${noun}s desactivados`,
          type: 'success',
        })
        clear()
      } catch {
        toast.add({ title: `No pudimos actualizar los ${noun}s`, type: 'error' })
      }
    })
  }

  function handleBulkFeature() {
    startTransition(async () => {
      try {
        await bulkToggleProductFeatured(selectedIds, true)
        toast.add({ title: `${selectedIds.length} ${noun}s destacados`, type: 'success' })
        clear()
      } catch (error) {
        toast.add({
          title: `No pudimos destacar los ${noun}s`,
          description: error instanceof Error ? error.message : undefined,
          type: 'error',
        })
      }
    })
  }

  function handleBulkDelete() {
    startTransition(async () => {
      try {
        await bulkDeleteProducts(selectedIds)
        toast.add({ title: `${selectedIds.length} ${noun}s eliminados`, type: 'success' })
        clear()
      } catch {
        toast.add({ title: `No pudimos eliminar los ${noun}s`, type: 'error' })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {totalCount ?? products.length} {noun}
          {(totalCount ?? products.length) === 1 ? '' : 's'} · {activeCount} activo
          {activeCount === 1 ? '' : 's'}
        </p>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${noun}...`}
            value={query}
            onChange={(event) => {
              handleSearchChange(event.target.value)
            }}
            className="pl-9"
            aria-label={`Buscar ${noun}`}
          />
        </div>
      </div>

      <BulkActionsBar count={selected.size} onClear={clear}>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleBulkToggle(true)}>
          Activar
        </Button>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleBulkToggle(false)}>
          Desactivar
        </Button>
        {canFeature && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleBulkFeature}>
            Destacar
          </Button>
        )}
        <ConfirmDialog
          trigger={<Button variant="outline" size="sm" className="gap-1.5 text-destructive" />}
          triggerLabel={
            <>
              <Trash2 className="size-3.5" aria-hidden />
              Borrar
            </>
          }
          title={`¿Eliminar ${selected.size} ${noun}${selected.size === 1 ? '' : 's'}?`}
          description="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          isConfirming={isPending}
          onConfirm={handleBulkDelete}
        />
      </BulkActionsBar>

      {pageProducts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No encontramos {noun}s que coincidan con &quot;{query}&quot;.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:hidden">
            {pageProducts.map((product) => (
              <Card
                key={product.id}
                className={product.is_active ? undefined : 'opacity-60'}
              >
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={() => toggle(product.id)}
                      aria-label={`Seleccionar ${product.name}`}
                    />
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      {product.categoryName ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {product.categoryName}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1 truncate text-xs font-medium text-warning-foreground">
                          <AlertTriangle className="size-3 shrink-0" aria-hidden />
                          Sin subcategoría
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-sm">
                        {formatPrice(product.price, product.currency)}
                      </span>
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
                  </div>

                  <div className="flex justify-end border-t border-border/60 pt-3">
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

          <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleAll}
                    aria-label={`Seleccionar todos los ${noun}s de esta página`}
                  />
                </TableHead>
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
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={() => toggle(product.id)}
                      aria-label={`Seleccionar ${product.name}`}
                    />
                  </TableCell>
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
                        {product.categoryName ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {product.categoryName}
                          </p>
                        ) : (
                          <p className="flex items-center gap-1 truncate text-xs font-medium text-warning-foreground">
                            <AlertTriangle className="size-3 shrink-0" aria-hidden />
                            Sin subcategoría
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
          </div>
        </div>
      )}
    </div>
  )
}
