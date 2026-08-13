'use client'

import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <TriangleAlert className="size-7" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl">Algo salió mal</h1>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Tuvimos un problema para cargar esto. Probá de nuevo en un momento.
        </p>
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  )
}
