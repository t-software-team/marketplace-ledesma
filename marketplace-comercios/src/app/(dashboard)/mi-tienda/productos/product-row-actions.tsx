'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deleteProduct, toggleProductActive } from '@/lib/shops/actions'

interface ProductRowActionsProps {
  productId: string
  isActive: boolean
}

export function ProductRowActions({ productId, isActive }: ProductRowActionsProps) {
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
