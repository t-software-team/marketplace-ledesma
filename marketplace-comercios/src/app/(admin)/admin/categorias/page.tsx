import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { StatusBadge } from '@/components/shared/status-badge'
import { getRubroIcon } from '@/lib/category-icons'
import { getCategoriesList } from '@/lib/admin/queries'
import { CategoryRowActions } from './category-row-actions'

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesList()
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">Categorías</h1>
        <Button render={<Link href="/admin/categorias/nueva" />} nativeButton={false}>
          Nueva categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState illustration={<EmptyBoxIllustration />} message="Todavía no hay categorías." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Padre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const Icon = getRubroIcon(category.slug)
              return (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {!category.parent_id && (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                      )}
                      {category.name}
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
      )}
    </div>
  )
}
