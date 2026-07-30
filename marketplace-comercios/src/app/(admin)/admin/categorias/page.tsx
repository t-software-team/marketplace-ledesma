import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { isServiceRubro } from '@/lib/category-icons'
import { getCategoriesList, getCategorySuggestions } from '@/lib/admin/queries'
import { CategoriesTable } from './categories-table'
import { CategorySuggestionsTable } from './category-suggestions-table'

export default async function AdminCategoriesPage() {
  const [categories, suggestions] = await Promise.all([getCategoriesList(), getCategorySuggestions()])
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length

  const categoryById = new Map(categories.map((category) => [category.id, category]))
  function rubroSlugFor(category: (typeof categories)[number]) {
    return category.parent_id
      ? (categoryById.get(category.parent_id)?.slug ?? category.slug)
      : category.slug
  }
  const serviceCategories = categories.filter((category) => isServiceRubro(rubroSlugFor(category)))
  const productCategories = categories.filter((category) => !isServiceRubro(rubroSlugFor(category)))

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

      <Tabs defaultValue="categorias">
        <TabsList>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="sugerencias">Sugerencias {pendingCount > 0 && `(${pendingCount})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="space-y-3 pt-3">
          {categories.length === 0 ? (
            <EmptyState illustration={<EmptyBoxIllustration />} message="Todavía no hay categorías." />
          ) : (
            <Tabs defaultValue="productos">
              <TabsList>
                <TabsTrigger value="productos">Productos ({productCategories.length})</TabsTrigger>
                <TabsTrigger value="servicios">Servicios ({serviceCategories.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="productos" className="pt-3">
                {productCategories.length === 0 ? (
                  <EmptyState message="No hay categorías de productos." />
                ) : (
                  <CategoriesTable categories={productCategories} />
                )}
              </TabsContent>

              <TabsContent value="servicios" className="pt-3">
                {serviceCategories.length === 0 ? (
                  <EmptyState message="No hay categorías de servicios." />
                ) : (
                  <CategoriesTable categories={serviceCategories} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="sugerencias" className="pt-3">
          {suggestions.length === 0 ? (
            <EmptyState
              illustration={<EmptyBoxIllustration />}
              message="Todavía no hay sugerencias de comercios."
            />
          ) : (
            <CategorySuggestionsTable suggestions={suggestions} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
