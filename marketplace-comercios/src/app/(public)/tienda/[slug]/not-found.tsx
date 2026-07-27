import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ShopNotFound() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <h1 className="text-xl font-heading">Tienda no encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esta tienda no existe o ya no está disponible.
      </p>
      <Button className="mt-6" render={<Link href="/" />} nativeButton={false}>
        Volver al inicio
      </Button>
    </div>
  )
}
