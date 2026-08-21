'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { toggleCategoryActive } from '@/lib/admin/actions/categories'

interface CategoryRowActionsProps {
  categoryId: string
  isActive: boolean
}

export function CategoryRowActions({ categoryId, isActive }: CategoryRowActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleCategoryActive(categoryId, !isActive)
        toast.add({ title: isActive ? 'Categoría desactivada' : 'Categoría activada', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos actualizar la categoría', type: 'error' })
      }
    })
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
      <Button
        render={<Link href={`/admin/categorias/${categoryId}/editar`} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Editar
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
    </div>
  )
}
