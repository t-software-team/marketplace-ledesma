import { redirect } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BackLink } from '@/components/shared/back-link'
import { EmptyState } from '@/components/shared/empty-state'
import { toWhatsAppNumber } from '@/lib/whatsapp'
import { getExpiringMembers, getGymPlans, getMyShopId } from '@/lib/gym/queries'
import { getMyShop } from '@/lib/shops/queries'
import { RenewMemberDialog } from '../socios/renew-member-dialog'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR')
}

function daysLabel(days: number) {
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  return `Vence en ${days} días`
}

export default async function VencimientosPage() {
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const [expiring, plans, shop] = await Promise.all([
    getExpiringMembers(shopId, 7),
    getGymPlans(shopId),
    getMyShop(),
  ])

  const activePlans = plans
    .filter((p) => p.is_active)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }))
  const shopName = shop?.name ?? 'el gimnasio'

  return (
    <div className="space-y-4">
      <BackLink href="/mi-tienda" label="Volver al panel" />
      <div>
        <h1 className="text-2xl font-heading">Vencimientos</h1>
        <p className="text-sm text-muted-foreground">
          Socios cuya membresía vence en los próximos 7 días. Recordales por WhatsApp o renová en el
          acto.
        </p>
      </div>

      {expiring.length === 0 ? (
        <EmptyState message="No hay membresías por vencer en los próximos 7 días. Todo al día." />
      ) : (
        <div className="space-y-2">
          {expiring.map((member) => {
            const message = `Hola ${member.full_name}, te recordamos que tu membresía en ${shopName} vence el ${formatDate(
              member.expires_at
            )}. ¡Te esperamos para renovar!`
            const waUrl = member.phone
              ? `https://wa.me/${toWhatsAppNumber(member.phone)}?text=${encodeURIComponent(message)}`
              : null

            return (
              <Card key={member.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.full_name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.days_left <= 1 ? 'warning' : 'outline'}>
                        {daysLabel(member.days_left)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(member.expires_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {waUrl ? (
                      <Button
                        render={<a href={waUrl} target="_blank" rel="noopener noreferrer" />}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        <MessageCircle className="size-4" aria-hidden />
                        WhatsApp
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin teléfono</span>
                    )}
                    <RenewMemberDialog memberId={member.id} plans={activePlans} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
