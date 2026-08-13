import {
  CalendarX,
  Clock,
  FileCheck,
  Flag,
  MessageCircle,
  Package,
  ReceiptText,
  ShieldCheck,
  ShieldX,
  Star,
} from 'lucide-react'
import { getAdminNotifications } from '@/lib/admin/queries'
import {
  markAdminNotificationRead,
  deleteAdminNotification,
  deleteReadAdminNotifications,
} from '@/lib/admin/actions'
import { NotificationList, type NotificationListRow } from '@/components/shared/notification-list'
import { PaginationLinks } from '@/components/shared/pagination-links'

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileCheck; style: string; href: (referenceId: string) => string }
> = {
  new_verification_request: {
    label: 'Nueva solicitud de verificación',
    icon: FileCheck,
    style: 'bg-verified/20 text-verified-foreground',
    href: (referenceId) => `/admin/shops/${referenceId}`,
  },
  new_subscription_request: {
    label: 'Nueva solicitud de suscripción',
    icon: ReceiptText,
    style: 'bg-primary/15 text-primary',
    href: () => '/admin/subscripciones',
  },
  new_report: {
    label: 'Nuevo reporte de comercio',
    icon: Flag,
    style: 'bg-destructive/15 text-destructive',
    href: () => '/admin/reportes',
  },
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
}

interface AdminNotificationsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminNotificationsPage({
  searchParams,
}: AdminNotificationsPageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { notifications, totalCount, totalPages } = await getAdminNotifications(page, 30)

  const rows: NotificationListRow[] = notifications.map((notification) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type]
    const Icon = config?.icon ?? FileCheck
    return {
      id: notification.id,
      href: config ? config.href(notification.reference_id) : '/admin',
      icon: <Icon className="size-4.5" aria-hidden />,
      style: config?.style ?? 'bg-muted text-muted-foreground',
      label: config?.label ?? 'Notificación',
      createdAt: notification.created_at,
      isRead: notification.is_read,
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading">Notificaciones</h1>
      <NotificationList
        rows={rows}
        onMarkRead={markAdminNotificationRead}
        onDelete={deleteAdminNotification}
        onDeleteAllRead={deleteReadAdminNotifications}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        basePath="/admin/notificaciones"
      />
    </div>
  )
}
