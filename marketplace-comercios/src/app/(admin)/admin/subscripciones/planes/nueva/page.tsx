import { createSubscriptionPlan } from '@/lib/admin/actions'
import { PlanForm } from '../../plan-form'

export default function NewPlanPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-heading">Nuevo plan</h1>
      <PlanForm action={createSubscriptionPlan} submitLabel="Crear plan" />
    </div>
  )
}
