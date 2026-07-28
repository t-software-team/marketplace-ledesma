import { getCategoriesList } from '@/lib/admin/queries'
import { createCategory } from '@/lib/admin/actions'
import { BackLink } from '@/components/shared/back-link'
import { CategoryForm } from '../category-form'

export default async function NewCategoryPage() {
  const categories = await getCategoriesList()

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/admin/categorias" />
      <h1 className="text-2xl font-heading">Nueva categoría</h1>
      <CategoryForm categories={categories} action={createCategory} submitLabel="Crear categoría" />
    </div>
  )
}
