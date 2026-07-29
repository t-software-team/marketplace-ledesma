'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionsBarProps {
  count: number
  onClear: () => void
  children: React.ReactNode
}

export function BulkActionsBar({ count, onClear, children }: BulkActionsBarProps) {
  if (count === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
      <span className="text-sm font-medium">
        {count} seleccionado{count === 1 ? '' : 's'}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto"
        onClick={onClear}
        aria-label="Limpiar selección"
      >
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  )
}
