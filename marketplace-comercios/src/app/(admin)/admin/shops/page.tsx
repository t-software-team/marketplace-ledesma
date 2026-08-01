import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { getShopsForReview, getSubscriptionPlans } from '@/lib/admin/queries'
import { ShopsTable } from './shops-table'

export default async function AdminShopsPage() {
  const [shops, plans] = await Promise.all([getShopsForReview(), getSubscriptionPlans()])

  const groups: Record<'pending' | 'verified' | 'rejected' | 'all', typeof shops> = {
    pending: shops.filter((shop) => shop.verification_status === 'pending'),
    verified: shops.filter((shop) => shop.verification_status === 'verified'),
    rejected: shops.filter((shop) => shop.verification_status === 'rejected'),
    all: shops,
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Comercios</h1>
        <p className="text-sm text-muted-foreground">
          Verificación de comercios registrados
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="verified">Verificados ({groups.verified.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados ({groups.rejected.length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({groups.all.length})</TabsTrigger>
        </TabsList>

        {(Object.keys(groups) as Array<keyof typeof groups>).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3 pt-3">
            {groups[key].length === 0 ? (
              <EmptyState
                illustration={<EmptyBoxIllustration />}
                message="No hay comercios en esta categoría."
              />
            ) : (
              <ShopsTable shops={groups[key]} plans={plans} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
