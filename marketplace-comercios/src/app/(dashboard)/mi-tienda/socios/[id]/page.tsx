import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackLink } from '@/components/shared/back-link'
import {
  getGymMember,
  getGymPlans,
  getMyShopId,
  type GymMemberStatus,
  type GymPaymentMethod,
} from '@/lib/gym/queries'
import { MemberEditForm } from './member-edit-form'
import { RenewMemberDialog } from '../renew-member-dialog'

const STATUS: Record<GymMemberStatus, { label: string; variant: 'success' | 'warning' | 'outline' }> =
  {
    active: { label: 'Activo', variant: 'success' },
    expired: { label: 'Vencido', variant: 'warning' },
    archived: { label: 'Baja', variant: 'outline' },
  }

const METHOD_LABELS: Record<GymPaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR')
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shopId = await getMyShopId()
  if (!shopId) redirect('/mi-tienda')

  const [member, plans] = await Promise.all([getGymMember(shopId, id), getGymPlans(shopId)])
  if (!member) notFound()

  const activePlans = plans
    .filter((p) => p.is_active)
    .map((p) => ({ id: p.id, name: p.name, price: p.price }))
  const status = STATUS[member.status]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/mi-tienda/socios" label="Volver a socios" />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>{member.full_name}</CardTitle>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {!member.is_archived && (
              <RenewMemberDialog memberId={member.id} plans={activePlans} triggerVariant="default" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {member.expires_at ? `Vence ${formatDate(member.expires_at)}` : 'Sin membresía'}
          </p>
        </CardHeader>
        <CardContent>
          <MemberEditForm member={member} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membresías</CardTitle>
        </CardHeader>
        <CardContent>
          {member.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin membresías registradas.</p>
          ) : (
            <div className="space-y-2">
              {member.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{m.plan_name ?? 'Plan eliminado'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.start_date)} → {formatDate(m.expires_at)}
                    </p>
                  </div>
                  <span className="font-mono">{formatARS(m.price)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {member.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos.</p>
            ) : (
              <div className="space-y-2">
                {member.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-mono">{formatARS(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {METHOD_LABELS[p.method]} ·{' '}
                        {formatDate((p.paid_at ?? p.created_at).slice(0, 10))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            {member.check_ins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ingresos registrados.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {member.check_ins.map((c) => (
                  <li key={c.id} className="text-muted-foreground">
                    {formatDateTime(c.checked_in_at)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
