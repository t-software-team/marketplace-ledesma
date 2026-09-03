import { Badge, type badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  verified: { label: 'Verificada', variant: 'success' },
  active: { label: 'Activa', variant: 'success' },
  approved: { label: 'Aprobado', variant: 'success' },
  reviewed: { label: 'Revisado', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  dismissed: { label: 'Descartado', variant: 'destructive' },
  expired: { label: 'Vencida', variant: 'destructive' },
  none: { label: 'Sin suscripción', variant: 'outline' },
  confirmed: { label: 'Confirmado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  completed: { label: 'Completado', variant: 'success' },
  no_show: { label: 'No-show', variant: 'destructive' },
  blocked: { label: 'Bloqueado', variant: 'outline' },
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const entry = STATUS_MAP[status] ?? { label: status, variant: 'outline' as BadgeVariant }
  return (
    <Badge variant={entry.variant} className={className}>
      {label ?? entry.label}
    </Badge>
  )
}
