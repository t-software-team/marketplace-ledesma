import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { getMyGymAccess } from '@/lib/gym/queries'
import { getStaff, type StaffStatus } from '@/lib/shops/queries'
import { InviteStaffDialog } from './invite-staff-dialog'
import { RevokeStaffButton } from './revoke-staff-button'

const STATUS_LABEL: Record<StaffStatus, { label: string; variant: 'success' | 'warning' | 'outline' }> = {
  pending: { label: 'Invitación enviada', variant: 'warning' },
  active: { label: 'Activo', variant: 'success' },
  revoked: { label: 'Revocado', variant: 'outline' },
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR')
}

export default async function EquipoPage() {
  const access = await getMyGymAccess()
  if (!access) redirect('/mi-tienda')
  // Staff no gestiona el equipo — es una decisión exclusiva del dueño.
  if (access.role !== 'owner') redirect('/mi-tienda/ingresos')

  const staff = await getStaff(access.shopId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading">Equipo</h1>
          <p className="text-sm text-muted-foreground">
            Empleados con acceso al mostrador: registrar ingresos, dar de alta socios y renovar
            membresías. No tienen acceso a caja completa, planes, reportes ni configuración.
          </p>
        </div>
        <InviteStaffDialog />
      </div>

      {staff.length === 0 ? (
        <EmptyState message="Todavía no invitaste a nadie. El mostrador funciona igual solo con vos." />
      ) : (
        <div className="space-y-2">
          {staff.map((s) => {
            const status = STATUS_LABEL[s.status]
            return (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.invited_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.accepted_at
                        ? `Activo desde el ${formatDate(s.accepted_at)}`
                        : `Invitado el ${formatDate(s.created_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <RevokeStaffButton staffId={s.id} email={s.invited_email} />
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
