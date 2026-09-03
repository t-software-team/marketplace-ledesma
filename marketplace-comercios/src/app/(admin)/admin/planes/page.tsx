import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { SavedToast } from '@/components/shared/saved-toast'
import { getSubscriptionPlans } from '@/lib/admin/queries'
import { PlansTable } from './plans-table'

export default async function AdminPlanesPage() {
  const plans = await getSubscriptionPlans()

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <div>
        <h1 className="text-2xl font-heading">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de planes de suscripción
        </p>
      </div>

      <div className="flex justify-end">
        <Button render={<Link href="/admin/planes/nueva" />} nativeButton={false}>
          Nuevo plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState illustration={<EmptyBoxIllustration />} message="Todavía no hay planes." />
      ) : (
        <PlansTable plans={plans} />
      )}
    </div>
  )
}
