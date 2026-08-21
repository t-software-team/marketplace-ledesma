'use client'

import { useMemo, useState, useTransition } from 'react'
import { CornerDownRight, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import { getRubroIcon, isServiceRubro } from '@/lib/category-icons'
import { bulkDeleteCategories, bulkToggleCategoryActive } from '@/lib/admin/actions/categories'
import type { getCategoriesList } from '@/lib/admin/queries'
import { CategoryRowActions } from './category-row-actions'

type Category = Awaited<ReturnType<typeof getCategoriesList>>[number]
type OrderedCategory = Category & { depth: number }

const PAGE_SIZE = 15

function buildTreeOrder(categories: Category[]): OrderedCategory[] {
  const childrenByParent = new Map<string, Category[]>()
  const byId = new Map(categories.map((category) => [category.id, category]))

  for (const category of categories) {
    if (!category.parent_id) continue
    const siblings = childrenByParent.get(category.parent_id) ?? []
    siblings.push(category)
    childrenByParent.set(category.parent_id, siblings)
  }

  const ordered: OrderedCategory[] = []

  for (const category of categories) {
    const isTopLevel = !category.parent_id || !byId.has(category.parent_id)
    if (!isTopLevel) continue
    ordered.push({ ...category, depth: 0 })
    for (const child of childrenByParent.get(category.id) ?? []) {
      ordered.push({ ...child, depth: 1 })
    }
  }

  return ordered
}

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const treeOrdered = useMemo(() => buildTreeOrder(categories), [categories])

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return treeOrdered
    return treeOrdered.filter(
      (category) =>
        category.name.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query)
    )
  }, [treeOrdered, search])

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageCategories = filteredCategories.slice(start, start + PAGE_SIZE)

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageCategories.map((category) => category.id)
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

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
      <Input
        value={search}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder="Buscar por nombre o slug..."
        aria-label="Buscar categorías"
        className="max-w-sm"
      />

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
            <TableHead>Productos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageCategories.map((category) => {
            const Icon = getRubroIcon(category.slug)
            const rubroSlug =
              category.parent_id && categoryById.has(category.parent_id)
                ? categoryById.get(category.parent_id)!.slug
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
                  <div
                    className="flex items-center gap-2 font-medium"
                    style={category.depth > 0 ? { paddingLeft: `${category.depth * 1.5}rem` } : undefined}
                  >
                    {category.depth > 0 && (
                      <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    {category.depth === 0 && (
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
                <TableCell className="font-mono text-muted-foreground tabular-nums">
                  {category.productCount}
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
        totalCount={filteredCategories.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
