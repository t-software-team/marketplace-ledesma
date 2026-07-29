import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { getCategoriesList } from '@/lib/admin/queries'
import { CategoriesTable } from './categories-table'

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesList()

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
        <CategoriesTable categories={categories} />
      )}
    </div>
  )
}
