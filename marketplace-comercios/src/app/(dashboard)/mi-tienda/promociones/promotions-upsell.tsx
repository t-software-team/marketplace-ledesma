import Link from 'next/link'
import { ImagePlus, Lock, Sparkles, Type, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const STEPS = [
  {
    icon: ImagePlus,
    title: 'Subí una foto',
    description: 'De un producto, un servicio o algo que ya tengas cargado en tu tienda.',
  },
  {
    icon: Type,
    title: 'Escribí tu promo',
    description: 'Ej: "2x1 hoy" o "Envío gratis" — elegí color, tamaño y posición del texto.',
  },
  {
    icon: Zap,
    title: 'Se publica sola',
    description: 'Aparece destacada en el feed por 1 a 3 días, y la podés compartir a WhatsApp e Instagram.',
  },
]

export function PromotionsUpsell({ noun = 'producto' }: { noun?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 pt-6 sm:grid-cols-[180px_1fr]">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[180px] overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/70 to-destacado/60">
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="size-10 text-white/30" aria-hidden />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-xs font-medium text-white/70">{noun === 'servicio' ? 'Corte de pelo' : 'Zapatillas urbanas'}</p>
            <p className="mt-1 text-base font-semibold text-white">2x1 hoy 🔥</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="flex size-9 items-center justify-center rounded-full bg-background/90">
              <Lock className="size-4 text-foreground" aria-hidden />
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Beneficio del Plan 50 y el Plan Ilimitado</p>
            <h3 className="mt-0.5 font-heading text-lg">Así se ve una promo en el feed</h3>
          </div>

          <div className="space-y-3">
            {STEPS.map((step) => (
              <div key={step.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="size-4 text-primary" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false} className="w-full sm:w-auto">
            Mejorar visibilidad
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
