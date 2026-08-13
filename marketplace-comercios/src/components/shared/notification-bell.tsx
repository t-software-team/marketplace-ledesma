'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format'
import { toast } from '@/components/ui/toast'

const GENERIC_ERROR = 'No pudimos completar la acción. Intentá de nuevo.'

export interface NotificationItem {
  id: string
  type: string
  reference_id: string
  created_at: string
  is_read?: boolean
}

export interface NotificationTypeConfig {
  label: string
  icon: LucideIcon
  style: string
  href: (notification: NotificationItem) => string
}

export type NotificationTypeConfigMap = Record<string, NotificationTypeConfig>

const DEFAULT_TYPE_CONFIG: NotificationTypeConfig = {
  label: 'Notificación',
  icon: Bell,
  style: 'bg-muted text-muted-foreground',
  href: () => '#',
}

function formatUnreadCount(count: number) {
  return count > 9 ? '9+' : String(count)
}

interface NotificationBellProps {
  notifications?: NotificationItem[]
  unreadCount?: number
  typeConfig: NotificationTypeConfigMap
  onMarkRead?: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onDeleteAllRead?: () => Promise<void>
  realtimeTable: string
  detailHref: string
}

export function NotificationBell({
  notifications,
  unreadCount: unreadCountProp,
  typeConfig,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onDeleteAllRead,
  realtimeTable,
  detailHref,
}: NotificationBellProps) {
  const router = useRouter()
  const [isMarkingRead, startMarkingRead] = useTransition()
  const [isDeletingAllRead, startDeletingAllRead] = useTransition()
  const [extraNotifications, setExtraNotifications] = useState<NotificationItem[]>([])
  const [extraUnreadCount, setExtraUnreadCount] = useState(0)
  const [syncedNotifications, setSyncedNotifications] = useState(notifications)
  const [readOverrides, setReadOverrides] = useState<Set<string>>(new Set())
  const [unreadDelta, setUnreadDelta] = useState(0)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  if (notifications !== syncedNotifications) {
    setSyncedNotifications(notifications)
    setExtraNotifications([])
    setExtraUnreadCount(0)
    setReadOverrides(new Set())
    setUnreadDelta(0)
    setDeletedIds(new Set())
  }

  useEffect(() => {
    if (notifications === undefined) return

    const supabase = createClient()
    const channel = supabase
      .channel(`${realtimeTable}-bell`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: realtimeTable },
        (payload) => {
          const row = payload.new as NotificationItem
          setExtraNotifications((current) => [row, ...current].slice(0, 10))
          setExtraUnreadCount((current) => current + 1)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [notifications, realtimeTable])

  const notificationList = notifications
    ? [...extraNotifications, ...notifications]
        .filter((notification) => !deletedIds.has(notification.id))
        .slice(0, 10)
    : null
  const unreadCount = Math.max(0, (unreadCountProp ?? 0) + extraUnreadCount + unreadDelta)

  function isNotificationUnread(notification: NotificationItem) {
    return !notification.is_read && !readOverrides.has(notification.id)
  }

  function handleMarkAllRead() {
    startMarkingRead(async () => {
      try {
        await onMarkAllRead()
        setExtraNotifications([])
        setExtraUnreadCount(0)
        setReadOverrides(new Set())
        setUnreadDelta(0)
        router.refresh()
      } catch {
        toast.add({ title: GENERIC_ERROR, type: 'error' })
      }
    })
  }

  function handleNotificationClick(notification: NotificationItem) {
    if (!onMarkRead || !isNotificationUnread(notification)) return
    setReadOverrides((current) => new Set(current).add(notification.id))
    setUnreadDelta((current) => current - 1)
    onMarkRead(notification.id).catch(() => {
      toast.add({ title: GENERIC_ERROR, type: 'error' })
    })
  }

  function handleDelete(id: string) {
    if (!onDelete) return
    setDeletedIds((current) => new Set(current).add(id))
    onDelete(id).catch(() => {
      setDeletedIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      toast.add({ title: GENERIC_ERROR, type: 'error' })
    })
  }

  function handleDeleteAllRead() {
    if (!onDeleteAllRead) return
    const readIds = (notificationList ?? [])
      .filter((notification) => !isNotificationUnread(notification))
      .map((notification) => notification.id)
    startDeletingAllRead(async () => {
      try {
        await onDeleteAllRead()
        setDeletedIds((current) => new Set([...current, ...readIds]))
        router.refresh()
      } catch {
        toast.add({ title: GENERIC_ERROR, type: 'error' })
      }
    })
  }

  if (!notificationList) return null

  const hasReadNotification = notificationList.some(
    (notification) => !isNotificationUnread(notification)
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
        nativeButton={true}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 size-2.5 animate-ping rounded-full bg-destructive opacity-75" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[10px] font-semibold shadow-sm"
            >
              {formatUnreadCount(unreadCount)}
            </Badge>
          </>
        )}
        <span className="sr-only">Notificaciones</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full px-1.5 text-[10px]">
              {formatUnreadCount(unreadCount)} nuevas
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        {notificationList.length === 0 ? (
          <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">
            No hay notificaciones nuevas
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
          {notificationList.map((notification) => {
            const config = typeConfig[notification.type] ?? DEFAULT_TYPE_CONFIG
            const Icon = config.icon
            const unread = isNotificationUnread(notification)

            const content = (
              <>
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${config.style}`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      'text-sm leading-snug',
                      unread ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
                {unread && (
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                )}
              </>
            )

            // Read rows get a delete button. Since DropdownMenuItem's `render`
            // composes the whole item into a single <Link>, nesting a <button>
            // inside it would produce invalid nested-interactive markup. So for
            // read rows we drop the DropdownMenuItem/Link composition and build
            // the row ourselves: a Link wrapping the content, plus a sibling
            // delete button, both inside a plain flex container.
            if (!unread && onDelete) {
              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-1 rounded-md py-2 pr-1.5 pl-2 hover:bg-muted/50"
                >
                  <Link
                    href={config.href(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex min-w-0 flex-1 items-start gap-2.5"
                  >
                    {content}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(notification.id)}
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive"
                    aria-label="Borrar notificación"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              )
            }

            return (
              <DropdownMenuItem
                key={notification.id}
                render={<Link href={config.href(notification)} />}
                onClick={() => handleNotificationClick(notification)}
                className={cn('items-start gap-2.5 rounded-md py-2', unread && 'bg-primary/5')}
              >
                {content}
              </DropdownMenuItem>
            )
          })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href={detailHref} />}
          className="justify-center text-sm font-medium text-primary"
        >
          Ver todas
        </DropdownMenuItem>
        {notificationList.length > 0 && (
          <DropdownMenuItem
            onClick={handleMarkAllRead}
            disabled={isMarkingRead}
            className="justify-center text-sm font-medium text-primary"
          >
            {isMarkingRead ? 'Marcando...' : 'Marcar todas como leídas'}
          </DropdownMenuItem>
        )}
        {onDeleteAllRead && hasReadNotification && (
          <DropdownMenuItem
            onClick={handleDeleteAllRead}
            disabled={isDeletingAllRead}
            className="justify-center text-sm font-medium text-muted-foreground hover:text-destructive focus:text-destructive"
          >
            {isDeletingAllRead ? 'Borrando...' : 'Limpiar leídas'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
