import { createSubscriptionPlan } from '@/lib/admin/actions/plans'
import { BackLink } from '@/components/shared/back-link'
import { getActiveCategories } from '@/lib/shops/queries'
import { PlanForm } from '../plan-form'

export default async function NewPlanPage() {
  const categories = await getActiveCategories()

  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href="/admin/planes" />
      <h1 className="text-2xl font-heading">Nuevo plan</h1>
      <PlanForm action={createSubscriptionPlan} categories={categories} submitLabel="Crear plan" />
    </div>
  )
}
