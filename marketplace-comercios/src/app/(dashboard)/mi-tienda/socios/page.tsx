import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyDumbbellIllustration } from '@/components/shared/empty-illustrations'
import {
  getGymMembers,
  getGymPlans,
  getMyShopId,
  type GymMemberStatus,
} from '@/lib/gym/queries'
import { getGymMemberLimitInfo } from '@/lib/shops/queries'
import { SociosList } from './socios-list'

const FILTERS: { value: GymMemberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'archived', label: 'Baja' },
]

interface SociosPageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function SociosPage({ searchParams }: SociosPageProps) {
  const { q, status } = await searchParams
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const search = q?.trim() || undefined
  const statusFilter = (['active', 'expired', 'archived'] as const).includes(
    status as GymMemberStatus
  )
    ? (status as GymMemberStatus)
    : undefined

  const [members, plans, limitInfo] = await Promise.all([
    getGymMembers(shopId, { search, status: statusFilter }),
    getGymPlans(shopId),
    getGymMemberLimitInfo(shopId),
  ])
  const activePlans = plans
    .filter((p) => p.is_active)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-heading">Socios</h1>
          <p className="text-xs text-muted-foreground">
            {limitInfo.max === null
              ? `${limitInfo.used} socios activos`
              : `${limitInfo.used} de ${limitInfo.max} socios de tu plan`}
          </p>
        </div>
        {limitInfo.reached ? (
          <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false}>
            Mejorar plan
          </Button>
        ) : (
          <Button render={<Link href="/mi-tienda/socios/nuevo" />} nativeButton={false}>
            Nuevo socio
          </Button>
        )}
      </div>

      {limitInfo.reached && (
        <p className="rounded-lg border border-warning bg-warning/30 p-3 text-sm text-warning-foreground">
          Llegaste al límite de {limitInfo.max} socios de tu plan.{' '}
          <Link href="/mi-tienda/suscripcion" className="underline">
            Mejorá al Plan Gimnasio
          </Link>{' '}
          para sumar socios sin tope.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active =
            filter.value === 'all' ? statusFilter === undefined : statusFilter === filter.value
          const query = filter.value === 'all' ? '' : `?status=${filter.value}`
          return (
            <Button
              key={filter.value}
              render={<Link href={`/mi-tienda/socios${query}`} />}
              nativeButton={false}
              variant={active ? 'default' : 'outline'}
              size="sm"
            >
              {filter.label}
            </Button>
          )
        })}
      </div>

      {members.length === 0 ? (
        <EmptyState
          illustration={search ? undefined : <EmptyDumbbellIllustration />}
          message={
            search
              ? 'No encontramos socios con ese nombre.'
              : 'Todavía no cargaste socios. Dá de alta al primero.'
          }
          action={
            !search ? (
              <Button
                render={<Link href="/mi-tienda/socios/nuevo" />}
                nativeButton={false}
                size="sm"
              >
                Dar de alta
              </Button>
            ) : undefined
          }
        />
      ) : (
        <SociosList members={members} plans={activePlans} />
      )}
    </div>
  )
}
