import {
  Calendar,
  CalendarX,
  Clock,
  MessageCircle,
  Package,
  ShieldCheck,
  ShieldX,
  Star,
} from 'lucide-react'
import { getMyShopNotifications } from '@/lib/notifications/queries'
import {
  markClientNotificationRead,
  deleteClientNotification,
  deleteReadClientNotifications,
} from '@/lib/notifications/actions'
import { NotificationList, type NotificationListRow } from '@/components/shared/notification-list'
import { PaginationLinks } from '@/components/shared/pagination-links'

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Star; style: string; href: (referenceId: string) => string }
> = {
  new_review: {
    label: 'Nueva reseña en tu comercio',
    icon: Star,
    style: 'bg-amber-500/15 text-amber-600',
    href: () => '/mi-tienda',
  },
  new_contact: {
    label: 'Nuevo contacto de un cliente',
    icon: MessageCircle,
    style: 'bg-primary/15 text-primary',
    href: () => '/mi-tienda',
  },
  verification_approved: {
    label: 'Tu verificación fue aprobada',
    icon: ShieldCheck,
    style: 'bg-verified/20 text-verified-foreground',
    href: () => '/mi-tienda/configuracion',
  },
  verification_rejected: {
    label: 'Tu verificación fue rechazada',
    icon: ShieldX,
    style: 'bg-destructive/15 text-destructive',
    href: () => '/mi-tienda/configuracion',
  },
  subscription_expiring_soon: {
    label: 'Tu suscripción está por vencer',
    icon: Clock,
    style: 'bg-amber-500/15 text-amber-600',
    href: () => '/mi-tienda/suscripcion',
  },
  subscription_expired: {
    label: 'Tu suscripción venció',
    icon: CalendarX,
    style: 'bg-destructive/15 text-destructive',
    href: () => '/mi-tienda/suscripcion',
  },
  new_product: {
    label: 'Un comercio que seguís publicó algo nuevo',
    icon: Package,
    style: 'bg-primary/10 text-primary',
    href: (referenceId) => `/producto/${referenceId}`,
  },
  new_turno_request: {
    label: 'Nueva solicitud de turno',
    icon: Calendar,
    style: 'bg-primary/15 text-primary',
    href: () => '/mi-tienda/turnos',
  },
}

interface ShopNotificationsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ShopNotificationsPage({
  searchParams,
}: ShopNotificationsPageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { notifications, totalCount, totalPages } = await getMyShopNotifications(page, 30)

  const rows: NotificationListRow[] = notifications.map((notification) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type]

    let extra: NotificationListRow['extra']
    if (notification.type === 'new_review' && notification.review) {
      extra = (
        <span className="text-xs text-muted-foreground">
          {'★'.repeat(notification.review.rating)}
          {notification.review.comment ? ` · ${notification.review.comment}` : ''}
        </span>
      )
    } else if (notification.type === 'new_contact' && notification.contact) {
      extra = notification.contact.productName ? (
        <span className="text-xs text-muted-foreground">
          Te contactaron por {notification.contact.productName}
        </span>
      ) : undefined
    } else if (notification.type === 'new_turno_request' && notification.appointment) {
      extra = (
        <span className="text-xs text-muted-foreground">
          {notification.appointment.customerName ?? 'Un cliente'} solicitó un turno
        </span>
      )
    }

    const Icon = config?.icon ?? Star

    return {
      id: notification.id,
      href: config ? config.href(notification.reference_id) : '/mi-tienda',
      icon: <Icon className="size-4.5" aria-hidden />,
      style: config?.style ?? 'bg-muted text-muted-foreground',
      label: config?.label ?? 'Notificación',
      createdAt: notification.created_at,
      isRead: notification.is_read,
      extra,
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading">Notificaciones</h1>
      <NotificationList
        rows={rows}
        onMarkRead={markClientNotificationRead}
        onDelete={deleteClientNotification}
        onDeleteAllRead={deleteReadClientNotifications}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        basePath="/mi-tienda/notificaciones"
      />
    </div>
  )
}
