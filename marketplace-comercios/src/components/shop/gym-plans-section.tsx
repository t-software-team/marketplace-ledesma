import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toWhatsAppNumber } from '@/lib/whatsapp'
import type { PublicGymPlan } from '@/lib/gym/queries'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function durationLabel(plan: PublicGymPlan) {
  if (plan.kind === 'daily' || plan.duration_days === 1) return 'Pase por el día'
  if (plan.kind === 'monthly' || plan.duration_days === 30) return 'Acceso por 1 mes'
  return `Acceso por ${plan.duration_days} días`
}

interface GymPlansSectionProps {
  plans: PublicGymPlan[]
  shopName: string
  whatsappNumber: string
}

export function GymPlansSection({ plans, shopName, whatsappNumber }: GymPlansSectionProps) {
  if (plans.length === 0) return null

  const phone = toWhatsAppNumber(whatsappNumber)
  // Highlight the monthly plan as the recommended tier; if there's none, the
  // grid stays flat — no forced hero.
  const recommendedId =
    plans.find((p) => p.kind === 'monthly')?.id ??
    plans.find((p) => p.duration_days === 30)?.id ??
    null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-heading">Planes</h2>
        <p className="text-sm text-muted-foreground">
          Elegí tu modalidad y asociate directo por WhatsApp.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const recommended = plan.id === recommendedId
          const message = `Hola ${shopName}, quiero asociarme con el plan ${plan.name}. ¿Cómo hago?`
          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col gap-4 rounded-xl border bg-surface p-5 transition-colors ${
                recommended
                  ? 'border-primary ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {recommended && (
                <Badge className="absolute -top-2.5 left-5">Recomendado</Badge>
              )}

              <div className="space-y-1">
                <h3 className="font-heading text-lg leading-tight">{plan.name}</h3>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  {durationLabel(plan)}
                </p>
              </div>

              <p className="font-mono text-3xl leading-none">{formatARS(plan.price)}</p>

              <Button
                render={<a href={waUrl} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                variant={recommended ? 'default' : 'outline'}
                className="mt-auto w-full"
              >
                Asociate
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
