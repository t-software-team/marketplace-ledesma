'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function SubscriptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('mi-tienda/suscripcion: error no controlado', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <AlertTriangle className="size-8 text-destructive" aria-hidden />
          <h1 className="font-heading text-lg">No pudimos iniciar el pago</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Ocurrió un error inesperado. Probá de nuevo en unos minutos.'}
          </p>
          <Button onClick={reset}>Reintentar</Button>
        </CardContent>
      </Card>
    </div>
  )
}
