import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMyActiveSubscription, getMyShop } from '@/lib/shops/queries'
import { PersonalizationForm } from './personalization-form'

export default async function PersonalizarPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const activeSubscription = await getMyActiveSubscription(shop.id)
  const hasCustomBranding = Boolean(
    (activeSubscription?.subscription_plans?.benefits as { custom_branding?: boolean } | null)
      ?.custom_branding
  )

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading">Personalizar tienda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dale identidad propia a tu tienda pública: color, banner, servicios destacados y video.
          </p>
        </div>
        <Button
          render={<Link href={`/tienda/${shop.slug}`} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          Ver cómo queda
          <ExternalLink className="size-3.5" aria-hidden />
        </Button>
      </div>

      {hasCustomBranding ? (
        <PersonalizationForm shop={shop} />
      ) : (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-3 pt-6 text-center">
            <p className="text-sm font-medium">Esto es parte del Plan Ilimitado</p>
            <p className="text-sm text-muted-foreground">
              Con el Plan Ilimitado podés elegir un color propio, agregar un banner promocional,
              mostrar tus servicios destacados y sumar un video a tu tienda pública.
            </p>
            <Button render={<Link href="/mi-tienda/suscripcion" />} nativeButton={false}>
              Ver planes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
