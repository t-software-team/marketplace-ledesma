'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deleteProduct, toggleProductActive, toggleProductFeatured } from '@/lib/shops/actions'

interface ProductRowActionsProps {
  productId: string
  isActive: boolean
  isFeatured: boolean
  canFeature: boolean
}

export function ProductRowActions({
  productId,
  isActive,
  isFeatured,
  canFeature,
}: ProductRowActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleProductActive(productId, !isActive)
        toast.add({ title: isActive ? 'Producto desactivado' : 'Producto activado', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos actualizar el producto', type: 'error' })
      }
    })
  }

  function handleToggleFeatured() {
    startTransition(async () => {
      try {
        await toggleProductFeatured(productId, !isFeatured)
        toast.add({ title: isFeatured ? 'Ya no está destacado' : 'Producto destacado', type: 'success' })
      } catch (error) {
        toast.add({
          title: 'No pudimos destacar el producto',
          description: error instanceof Error ? error.message : undefined,
          type: 'error',
        })
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProduct(productId)
        toast.add({ title: 'Producto eliminado', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos eliminar el producto', type: 'error' })
      }
    })
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
      <Button
        render={<Link href={`/mi-tienda/productos/${productId}/editar`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Editar
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
      {canFeature && (
        <Button
          variant={isFeatured ? 'default' : 'outline'}
          size="sm"
          disabled={isPending}
          onClick={handleToggleFeatured}
          className={isFeatured ? 'bg-warning text-warning-foreground hover:bg-warning/90' : undefined}
        >
          <Star className="size-3.5" aria-hidden />
          {isFeatured ? 'Destacado' : 'Destacar'}
        </Button>
      )}
      <ConfirmDialog
        trigger={<Button variant="destructive" size="sm" disabled={isPending} />}
        triggerLabel="Eliminar"
        title="¿Eliminar este producto?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isConfirming={isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
