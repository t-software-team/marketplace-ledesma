import { notFound } from 'next/navigation'
import { getCategoriesList, getCategoryById } from '@/lib/admin/queries'
import { updateCategory } from '@/lib/admin/actions/categories'
import { BackLink } from '@/components/shared/back-link'
import { CategoryForm } from '../../category-form'

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params
  const category = await getCategoryById(id)

  if (!category) notFound()

  const categories = await getCategoriesList()
  const updateCategoryWithId = updateCategory.bind(null, category.id)

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/admin/categorias" />
      <h1 className="text-2xl font-heading">Editar categoría</h1>
      <CategoryForm
        categories={categories}
        action={updateCategoryWithId}
        submitLabel="Guardar cambios"
        currentCategoryId={category.id}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          parent_id: category.parent_id,
          is_active: category.is_active,
        }}
      />
    </div>
  )
}
