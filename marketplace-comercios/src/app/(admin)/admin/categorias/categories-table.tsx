'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { getRubroIcon, isServiceRubro } from '@/lib/category-icons'
import type { getCategoriesList } from '@/lib/admin/queries'
import { CategoryRowActions } from './category-row-actions'

type Category = Awaited<ReturnType<typeof getCategoriesList>>[number]

const PAGE_SIZE = 15

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const [page, setPage] = useState(1)
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageCategories = categories.slice(start, start + PAGE_SIZE)

  return (
    <div className="space-y-3">
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
          {pageCategories.map((category) => {
            const Icon = getRubroIcon(category.slug)
            const rubroSlug = category.parent_id
              ? (categoryById.get(category.parent_id)?.slug ?? category.slug)
              : category.slug
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
