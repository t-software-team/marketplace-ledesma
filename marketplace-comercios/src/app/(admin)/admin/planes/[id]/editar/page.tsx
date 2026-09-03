import { notFound } from 'next/navigation'
import { getSubscriptionPlanById } from '@/lib/admin/queries'
import { updateSubscriptionPlan } from '@/lib/admin/actions/plans'
import { getActiveCategories } from '@/lib/shops/queries'
import { BackLink } from '@/components/shared/back-link'
import { PlanForm } from '../../plan-form'

interface EditPlanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  const { id } = await params
  const [plan, categories] = await Promise.all([getSubscriptionPlanById(id), getActiveCategories()])

  if (!plan) notFound()

  const updatePlanWithId = updateSubscriptionPlan.bind(null, plan.id)

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/admin/planes" />
      <h1 className="text-2xl font-heading">Editar plan</h1>
      <PlanForm
        action={updatePlanWithId}
        categories={categories}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration_days: plan.duration_days,
          benefits: plan.benefits,
          is_active: plan.is_active,
          applies_to: plan.applies_to,
          category_id: plan.category_id,
          max_products_service: plan.max_products_service,
          max_products_product: plan.max_products_product,
          max_images: plan.max_images,
          max_variants: plan.max_variants,
          max_gym_members: plan.max_gym_members,
        }}
      />
    </div>
  )
}
