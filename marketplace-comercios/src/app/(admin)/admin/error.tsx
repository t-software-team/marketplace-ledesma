'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Sin este boundary, un error real de Supabase en una query de admin caía
// en el error.tsx raíz (mensaje/CTA pensados para el marketplace público,
// "Volver al inicio") — acá el CTA vuelve al panel, no al feed de clientes.
export default function AdminError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <TriangleAlert className="size-7" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl">No pudimos cargar esto</h1>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Hubo un error trayendo los datos. Probá de nuevo o volvé al panel.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
        <Button render={<Link href="/admin/dashboard" />} nativeButton={false}>
          Volver al panel
        </Button>
      </div>
    </div>
  )
}
