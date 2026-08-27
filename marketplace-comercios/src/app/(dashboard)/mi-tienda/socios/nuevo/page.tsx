import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackLink } from '@/components/shared/back-link'
import { getGymPlans, getMyShopId } from '@/lib/gym/queries'
import { getGymMemberLimitInfo } from '@/lib/shops/queries'
import { Button } from '@/components/ui/button'
import { MemberForm } from '../member-form'

export default async function NuevoSocioPage() {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const [rawPlans, limitInfo] = await Promise.all([
    getGymPlans(shopId),
    getGymMemberLimitInfo(shopId),
  ])
  const plans = rawPlans.filter((plan) => plan.is_active)

  if (limitInfo.reached) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <BackLink href="/mi-tienda/socios" label="Volver a socios" />
        <Card>
          <CardHeader>
            <CardTitle>Llegaste al límite de socios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu plan permite hasta {limitInfo.max} socios activos. Mejorá al Plan Gimnasio para
              sumar socios sin tope.
            </p>
            <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false}>
              Ver el Plan Gimnasio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <BackLink href="/mi-tienda/socios" label="Volver a socios" />

      <Card>
        <CardHeader>
          <CardTitle>Nuevo socio</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero necesitás al menos un plan activo.{' '}
              <Link href="/mi-tienda/planes" className="underline">
                Creá un plan
              </Link>{' '}
              y volvé para dar de alta socios con su membresía. También podés cargar la ficha sin
              plan y cobrarle después.
            </p>
          ) : null}
          <MemberForm plans={plans.map((p) => ({ id: p.id, name: p.name, price: p.price }))} />
        </CardContent>
      </Card>
    </div>
  )
}
