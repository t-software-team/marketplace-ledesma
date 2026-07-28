import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = getRubroIcon(category.slug)
            return (
              <Card key={category.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {!category.parent_id && (
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">/{category.slug}</p>
                      {category.parent_id && (
                        <p className="text-xs text-muted-foreground">
                          Subcategoría de {categoryById.get(category.parent_id)?.name ?? '—'}
                        </p>
                      )}
                      <StatusBadge
                        status={category.is_active ? 'active' : 'none'}
                        label={category.is_active ? 'Activa' : 'Inactiva'}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <CategoryRowActions categoryId={category.id} isActive={category.is_active} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
