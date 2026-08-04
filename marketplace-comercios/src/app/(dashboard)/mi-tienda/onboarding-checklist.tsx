import Link from 'next/link'
import { Circle, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OnboardingChecklistProps {
  hasCategory: boolean
  hasBranding: boolean
  hasProducts: boolean
  isVerified: boolean
  isSubscribed: boolean
  noun: string
}

export function OnboardingChecklist({
  hasCategory,
  hasBranding,
  hasProducts,
  isVerified,
  isSubscribed,
  noun,
}: OnboardingChecklistProps) {
  const steps = [
    {
      id: 'category',
      done: hasCategory,
      label: 'Elegí el rubro de tu comercio',
      description: 'Define qué subcategorías vas a poder usar al cargar productos.',
      href: '/mi-tienda/configuracion#rubro',
      cta: 'Configurar',
    },
    {
      id: 'branding',
      done: hasBranding,
      label: 'Subí tu logo y portada',
      description: 'Un comercio con fotos genera mucha más confianza.',
      href: '/mi-tienda/configuracion#imagenes',
      cta: 'Configurar',
    },
    {
      id: 'product',
      done: hasProducts,
      label: `Cargá tu primer ${noun}`,
      description: 'Sin esto no vas a aparecer en el feed público.',
      href: '/mi-tienda/productos/nuevo',
      cta: `Cargar ${noun}`,
    },
    {
      id: 'verification',
      done: isVerified,
      label: 'Verificá tu comercio',
      description: 'Subí un documento (habilitación, DNI, factura) para tener el sello de verificado.',
      href: '/mi-tienda/configuracion#verificacion',
      cta: 'Verificar',
    },
    {
      id: 'subscription',
      done: isSubscribed,
      label: 'Mejorá tu visibilidad con una suscripción',
      description:
        'Con un plan activo podés destacar productos, habilitar reseñas de clientes y ganar mejor posicionamiento en el feed.',
      href: '/mi-tienda/suscripcion',
      cta: 'Ver planes',
    },
  ]

  const completedCount = steps.filter((step) => step.done).length

  if (completedCount === steps.length) return null

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-surface">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <h2 className="font-heading text-lg">Poné a punto tu comercio</h2>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {completedCount} de {steps.length}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        <ul className="space-y-3">
          {steps
            .filter((step) => !step.done)
            .map((step) => (
              <li key={step.id} className="flex items-start gap-3">
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/40" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Button
                  render={<Link href={step.href} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {step.cta}
                </Button>
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  )
}
