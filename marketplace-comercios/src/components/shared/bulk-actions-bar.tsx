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
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-primary/30 bg-background/95 px-4 py-2.5 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:mx-0 sm:rounded-lg sm:border sm:border-primary/30 sm:bg-primary/5 sm:px-3 sm:py-2 sm:shadow-none sm:backdrop-blur-none">
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
