import Image from 'next/image'
import { Package } from 'lucide-react'
import { getMyBuyerNotifications } from '@/lib/notifications/queries'
import {
  markClientNotificationRead,
  deleteClientNotification,
  deleteReadClientNotifications,
} from '@/lib/notifications/actions'
import { NotificationList, type NotificationListRow } from '@/components/shared/notification-list'
import { PaginationLinks } from '@/components/shared/pagination-links'

interface BuyerNotificationsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function BuyerNotificationsPage({
  searchParams,
}: BuyerNotificationsPageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { notifications, totalCount, totalPages } = await getMyBuyerNotifications(page, 30)

  const rows: NotificationListRow[] = notifications.map((notification) => {
    const product = notification.product

    return {
      id: notification.id,
      href: `/producto/${notification.reference_id}`,
      icon: <Package className="size-4.5" aria-hidden />,
      style: 'bg-primary/10 text-primary',
      label: product
        ? `${product.shopName ?? 'Un comercio que seguís'} publicó ${product.name}`
        : 'Un comercio que seguís publicó algo nuevo',
      createdAt: notification.created_at,
      isRead: notification.is_read,
      extra: product?.imageUrl ? (
        <span className="relative mt-1 flex size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
          <Image src={product.imageUrl} alt="" fill sizes="40px" className="object-cover" />
        </span>
      ) : undefined,
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
        basePath="/notificaciones"
      />
    </div>
  )
}
