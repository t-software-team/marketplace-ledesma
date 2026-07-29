'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import { getRubroIcon, isServiceRubro } from '@/lib/category-icons'
import { bulkDeleteCategories, bulkToggleCategoryActive } from '@/lib/admin/actions'
import type { getCategoriesList } from '@/lib/admin/queries'
import { CategoryRowActions } from './category-row-actions'

type Category = Awaited<ReturnType<typeof getCategoriesList>>[number]

const PAGE_SIZE = 15

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageCategories = categories.slice(start, start + PAGE_SIZE)

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageCategories.map((category) => category.id)
  )

  function handleBulkToggle(isActive: boolean) {
    startTransition(async () => {
      try {
        await bulkToggleCategoryActive(selectedIds, isActive)
        toast.add({
          title: isActive ? `${selectedIds.length} categorías activadas` : `${selectedIds.length} categorías desactivadas`,
          type: 'success',
        })
        clear()
      } catch {
        toast.add({ title: 'No pudimos actualizar las categorías', type: 'error' })
      }
    })
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const { deleted, failed } = await bulkDeleteCategories(selectedIds)
      if (deleted > 0) {
        toast.add({ title: `${deleted} categoría${deleted === 1 ? '' : 's'} eliminada${deleted === 1 ? '' : 's'}`, type: 'success' })
      }
      if (failed > 0) {
        toast.add({
          title: `${failed} categoría${failed === 1 ? '' : 's'} no se pudo eliminar`,
          description: 'Tienen subcategorías o productos asociados.',
          type: 'error',
        })
      }
      clear()
    })
  }

  return (
    <div className="space-y-3">
      <BulkActionsBar count={selected.size} onClear={clear}>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleBulkToggle(true)}>
          Activar
        </Button>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleBulkToggle(false)}>
          Desactivar
        </Button>
        <ConfirmDialog
          trigger={<Button variant="outline" size="sm" className="gap-1.5 text-destructive" />}
          triggerLabel={
            <>
              <Trash2 className="size-3.5" aria-hidden />
              Borrar
            </>
          }
          title={`¿Eliminar ${selected.size} categoría${selected.size === 1 ? '' : 's'}?`}
          description="Las que tengan subcategorías o productos asociados no se van a poder borrar."
          confirmLabel="Eliminar"
          isConfirming={isPending}
          onConfirm={handleBulkDelete}
        />
      </BulkActionsBar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todas las categorías de esta página"
              />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Padre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageCategories.map((category) => {
            const Icon = getRubroIcon(category.slug)
            const rubroSlug = category.parent_id
              ? (categoryById.get(category.parent_id)?.slug ?? category.slug)
              : category.slug
            return (
              <TableRow key={category.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(category.id)}
                    onCheckedChange={() => toggle(category.id)}
                    aria-label={`Seleccionar ${category.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {!category.parent_id && (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                    )}
                    {category.name}
                    {isServiceRubro(rubroSlug) && (
                      <Badge variant="outline" className="font-normal text-primary">
                        Servicio
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">/{category.slug}</TableCell>
                <TableCell className="text-muted-foreground">
                  {category.parent_id ? (categoryById.get(category.parent_id)?.name ?? '—') : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={category.is_active ? 'active' : 'none'}
                    label={category.is_active ? 'Activa' : 'Inactiva'}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <CategoryRowActions categoryId={category.id} isActive={category.is_active} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={categories.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
