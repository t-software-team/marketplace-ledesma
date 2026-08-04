import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationLinksProps {
  page: number
  totalPages: number
  totalCount: number
  basePath: string
  extraQuery?: Record<string, string>
}

export function PaginationLinks({
  page,
  totalPages,
  totalCount,
  basePath,
  extraQuery,
}: PaginationLinksProps) {
  if (totalPages <= 1) return null

  function buildHref(targetPage: number) {
    const params = new URLSearchParams(extraQuery)
    params.set('page', String(targetPage))
    return `${basePath}?${params.toString()}`
  }

  const prevHref = page > 1 ? buildHref(page - 1) : undefined
  const nextHref = page < totalPages ? buildHref(page + 1) : undefined

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {totalCount} resultados
      </p>
      <div className="flex gap-2">
        {prevHref ? (
          <Button render={<Link href={prevHref} />} nativeButton={false} variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="size-4" aria-hidden />
            Anterior
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1" disabled>
            <ChevronLeft className="size-4" aria-hidden />
            Anterior
          </Button>
        )}
        {nextHref ? (
          <Button render={<Link href={nextHref} />} nativeButton={false} variant="outline" size="sm" className="gap-1">
            Siguiente
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1" disabled>
            Siguiente
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  )
}
