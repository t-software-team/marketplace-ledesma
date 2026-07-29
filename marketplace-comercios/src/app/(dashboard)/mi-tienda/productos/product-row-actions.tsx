'use client'

import Link from 'next/link'
import { Eye, EyeOff, Pencil, Star, Trash2 } from 'lucide-react'
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
    <div className="flex shrink-0 items-center justify-center gap-1.5">
      <Button
        render={<Link href={`/mi-tienda/productos/${productId}/editar`} aria-label="Editar" />}
        nativeButton={false}
        variant="outline"
        size="icon"
      >
        <Pencil className="size-4" aria-hidden />
      </Button>

      <Button
        variant="outline"
        size="icon"
        disabled={isPending}
        onClick={handleToggle}
        aria-label={isActive ? 'Desactivar' : 'Activar'}
      >
        {isActive ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </Button>

      {canFeature && (
        <Button
          variant={isFeatured ? 'default' : 'outline'}
          size="icon"
          disabled={isPending}
          onClick={handleToggleFeatured}
          aria-label={isFeatured ? 'Quitar de destacados' : 'Destacar'}
        >
          <Star className={isFeatured ? 'size-4 fill-current' : 'size-4'} aria-hidden />
        </Button>
      )}

      <ConfirmDialog
        trigger={<Button variant="destructive" size="icon" disabled={isPending} aria-label="Eliminar" />}
        triggerLabel={<Trash2 className="size-4" aria-hidden />}
        title="¿Eliminar este producto?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isConfirming={isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
