import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackLink } from '@/components/shared/back-link'
import { getGymPlans, getMyShopId } from '@/lib/gym/queries'
import { MemberForm } from '../member-form'

export default async function NuevoSocioPage() {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const plans = (await getGymPlans(shopId)).filter((plan) => plan.is_active)

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
