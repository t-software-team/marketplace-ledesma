'use client'

import Link from 'next/link'
import { Copy, Eye, EyeOff, MoreVertical, Pencil, Star, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import {
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
  toggleProductFeatured,
} from '@/lib/shops/actions'

interface ProductRowActionsProps {
  productId: string
  isActive: boolean
  isFeatured: boolean
  canFeature: boolean
  compact?: boolean
}

export function ProductRowActions({
  productId,
  isActive,
  isFeatured,
  canFeature,
  compact = false,
}: ProductRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

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

  function handleDuplicate() {
    startTransition(async () => {
      try {
        await duplicateProduct(productId)
        toast.add({ title: 'Producto duplicado', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos duplicar el producto', type: 'error' })
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

  if (compact) {
    return (
      <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-11" aria-label="Más acciones" />}
          nativeButton={true}
        >
          <MoreVertical className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/mi-tienda/productos/${productId}/editar`} />}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem disabled={isPending} onClick={handleToggle}>
            {isActive ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {isActive ? 'Desactivar' : 'Activar'}
          </DropdownMenuItem>

          {canFeature && (
            <DropdownMenuItem disabled={isPending} onClick={handleToggleFeatured}>
              <Star className={isFeatured ? 'size-4 fill-current' : 'size-4'} aria-hidden />
              {isFeatured ? 'Quitar de destacados' : 'Destacar'}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem disabled={isPending} onClick={handleDuplicate}>
            <Copy className="size-4" aria-hidden />
            Duplicar
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar este producto?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isConfirming={isPending}
        onConfirm={handleDelete}
      />
      </>
    )
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

      <Button
        variant="outline"
        size="icon"
        disabled={isPending}
        onClick={handleDuplicate}
        aria-label="Duplicar"
      >
        <Copy className="size-4" aria-hidden />
      </Button>

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
