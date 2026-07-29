'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  page: number
  totalPages: number
  totalCount: number
  onPrevious: () => void
  onNext: () => void
}

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {totalCount} resultados
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={page <= 1}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Siguiente
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
