import { notFound } from 'next/navigation'
import { getSubscriptionPlanById } from '@/lib/admin/queries'
import { updateSubscriptionPlan } from '@/lib/admin/actions'
import { PlanForm } from '../../../plan-form'

interface EditPlanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  const { id } = await params
  const plan = await getSubscriptionPlanById(id)

  if (!plan) notFound()

  const updatePlanWithId = updateSubscriptionPlan.bind(null, plan.id)

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-heading">Editar plan</h1>
      <PlanForm
        action={updatePlanWithId}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration_days: plan.duration_days,
          benefits: plan.benefits,
          is_active: plan.is_active,
        }}
      />
    </div>
  )
}
