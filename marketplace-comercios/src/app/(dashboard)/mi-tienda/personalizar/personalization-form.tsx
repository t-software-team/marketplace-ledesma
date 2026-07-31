'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR } from '@/lib/accent-colors'
import { LandingSectionsEditor } from '@/components/shop/landing-sections-editor'
import { updateShopPersonalization, type ActionState } from '@/lib/shops/actions'
import type { getMyShop } from '@/lib/shops/queries'

type Shop = NonNullable<Awaited<ReturnType<typeof getMyShop>>>

const initialState: ActionState = { error: null }

export function PersonalizationForm({ shop }: { shop: Shop }) {
  const [state, formAction, isPending] = useActionState(updateShopPersonalization, initialState)
  const isFirstRender = useRef(true)
  const [accentColor, setAccentColor] = useState(shop.accent_color ?? DEFAULT_ACCENT_COLOR)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (state.error) {
      toast.add({ title: 'No pudimos guardar los cambios', description: state.error, type: 'error' })
    } else {
      toast.add({ title: 'Cambios guardados', type: 'success' })
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-sm font-medium text-muted-foreground">Color de tu tienda</h2>
          <input type="hidden" name="accent_color" value={accentColor} />
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.key}
                type="button"
                onClick={() => setAccentColor(color.key)}
                aria-label={color.label}
                aria-pressed={accentColor === color.key}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all',
                  accentColor === color.key ? 'ring-foreground' : 'ring-transparent'
                )}
                style={{ backgroundColor: color.swatch }}
              >
                {accentColor === color.key && <Check className="size-4 text-white" aria-hidden />}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Este color se usa en los botones y acentos de tu tienda pública (
            <span className="font-mono">proxi.com/tienda/{shop.slug}</span>).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">Secciones de tu tienda</h2>
          <LandingSectionsEditor
            shopId={shop.id}
            landingBanner={shop.landing_banner}
            landingServices={shop.landing_services}
            landingVideoUrl={shop.landing_video_url}
          />
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
