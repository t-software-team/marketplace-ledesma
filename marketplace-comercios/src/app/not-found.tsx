import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Compass className="size-7" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl">No encontramos esta página</h1>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          El link puede estar roto o la página ya no existe.
        </p>
      </div>
      <Button render={<Link href="/" />} nativeButton={false}>
        Volver al inicio
      </Button>
    </div>
  )
}
