'use client'

import type { ReactNode } from 'react'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format'
import { toast } from '@/components/ui/toast'

const GENERIC_ERROR = 'No pudimos completar la acción. Intentá de nuevo.'

export interface NotificationListRow {
  id: string
  href: string
  icon: ReactNode
  style: string
  label: string
  createdAt: string
  isRead: boolean
  extra?: ReactNode
}

interface NotificationListProps {
  rows: NotificationListRow[]
  onMarkRead?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onDeleteAllRead?: () => Promise<void>
}

/**
 * Full-page notification history list (`/notificaciones` for each role).
 * Reuses the same visual language as the NotificationBell dropdown, but as a
 * full-width list instead of a floating menu. Clicking an unread row marks
 * it as read, mirroring the dropdown's per-item mark-read behavior.
 */
export function NotificationList({ rows, onMarkRead, onDelete, onDeleteAllRead }: NotificationListProps) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [isDeletingAllRead, startDeletingAllRead] = useTransition()

  function handleClick(row: NotificationListRow) {
    if (!onMarkRead || row.isRead) return
    onMarkRead(row.id).catch(() => {
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
    const readIds = rows.filter((row) => row.isRead).map((row) => row.id)
    startDeletingAllRead(async () => {
      try {
        await onDeleteAllRead()
        setDeletedIds((current) => new Set([...current, ...readIds]))
      } catch {
        toast.add({ title: GENERIC_ERROR, type: 'error' })
      }
    })
  }

  const visibleRows = rows.filter((row) => !deletedIds.has(row.id))
  const hasReadRow = visibleRows.some((row) => row.isRead)

  if (rows.length === 0) {
    return (
      <p className="rounded-xl py-12 text-center text-sm text-muted-foreground ring-1 ring-border">
        No hay notificaciones todavía
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {onDeleteAllRead && hasReadRow && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeleteAllRead}
            disabled={isDeletingAllRead}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden />
            {isDeletingAllRead ? 'Borrando...' : 'Limpiar leídas'}
          </Button>
        </div>
      )}
      <ul className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-border">
        {visibleRows.map((row) => {
          return (
            <li key={row.id} className="flex items-start">
              <Link
                href={row.href}
                onClick={() => handleClick(row)}
                className={cn(
                  'flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50',
                  !row.isRead && 'bg-primary/5'
                )}
              >
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${row.style}`}
                >
                  {row.icon}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      'text-sm leading-snug',
                      !row.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {row.label}
                  </span>
                  {row.extra}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(row.createdAt)}
                  </span>
                </span>
                {!row.isRead && (
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                )}
              </Link>
              {row.isRead && onDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="mt-3.5 mr-4 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive"
                  aria-label="Borrar notificación"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
