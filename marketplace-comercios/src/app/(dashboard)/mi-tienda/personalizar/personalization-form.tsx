'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useTheme } from '@/components/providers/theme-provider'
import { DEFAULT_ACCENT_COLOR, getAccentColor, isHexColor } from '@/lib/accent-colors'
import { LandingSectionsEditor, type LandingSectionsValues } from '@/components/shop/landing/landing-sections-editor'
import { LandingBannerSection, LandingGallerySection, LandingServicesSection } from '@/components/shop/landing-sections'
import { LandingVideoSection } from '@/components/shop/landing-video-section'
import { updateShopPersonalization, type ActionState } from '@/lib/shops/actions'
import type { getMyShop } from '@/lib/shops/queries'

type Shop = NonNullable<Awaited<ReturnType<typeof getMyShop>>>

const initialState: ActionState = { error: null }

export function PersonalizationForm({ shop }: { shop: Shop }) {
  const { resolvedTheme } = useTheme()
  const [state, formAction, isPending] = useActionState(updateShopPersonalization, initialState)
  const isFirstRender = useRef(true)
  const [accentColor, setAccentColor] = useState(shop.accent_color ?? DEFAULT_ACCENT_COLOR)
  const [hexInput, setHexInput] = useState(() => getAccentColor(shop.accent_color ?? DEFAULT_ACCENT_COLOR).swatch)
  const [landingValues, setLandingValues] = useState<LandingSectionsValues | null>(null)

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

  function chooseColor(hex: string) {
    setAccentColor(hex)
    setHexInput(hex)
  }

  const selectedAccent = getAccentColor(accentColor)
  const previewAccent = resolvedTheme === 'dark' ? selectedAccent.dark : selectedAccent.light

  const previewBannerData =
    landingValues?.bannerEnabled && landingValues.banner.title.trim() ? landingValues.banner : null
  const previewServicesData = landingValues?.services.filter((service) => service.name.trim()) ?? []
  const previewGalleryData = landingValues?.gallery ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
      <form action={formAction} className="space-y-5 pb-20 lg:pb-0">
        <Card>
          <CardContent className="space-y-4 p-5 lg:p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Color de tu tienda</h2>
              <p className="mt-1 text-sm text-foreground/70">
                Se usa en los botones y detalles de tu tienda pública.
              </p>
            </div>
            <input type="hidden" name="accent_color" value={accentColor} />

            <div className="flex items-center gap-4">
              <label className="relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl ring-2 ring-border ring-offset-2 ring-offset-surface transition-transform hover:scale-105">
                <input
                  type="color"
                  value={selectedAccent.swatch}
                  onChange={(event) => chooseColor(event.target.value)}
                  aria-label="Elegir color personalizado"
                  className="absolute inset-0 size-[150%] cursor-pointer border-none p-0"
                />
              </label>
              <div className="flex-1">
                <label htmlFor="accent-color-hex" className="mb-1 block text-xs text-foreground/70">
                  Código de color
                </label>
                <input
                  id="accent-color-hex"
                  type="text"
                  value={hexInput}
                  onChange={(event) => {
                    const value = event.target.value
                    setHexInput(value)
                    if (isHexColor(value)) setAccentColor(value)
                  }}
                  onBlur={() => {
                    if (!isHexColor(hexInput)) setHexInput(selectedAccent.swatch)
                  }}
                  placeholder="#7c3aed"
                  maxLength={7}
                  className="h-11 w-full max-w-40 rounded-lg border border-border bg-background px-3 font-mono text-base text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <LandingSectionsEditor
          shopId={shop.id}
          landingBanner={shop.landing_banner}
          landingServices={shop.landing_services}
          landingGallery={shop.landing_gallery}
          landingVideoUrl={shop.landing_video_url}
          onChange={setLandingValues}
          visibleSection="all"
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="min-h-11 w-full shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] lg:w-auto"
            style={{ backgroundColor: previewAccent.primary, color: previewAccent.primaryForeground }}
          >
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      <div className="lg:sticky lg:top-4">
        <Card
          className="overflow-hidden border-dashed"
          style={
            {
              '--primary': previewAccent.primary,
              '--primary-foreground': previewAccent.primaryForeground,
            } as React.CSSProperties
          }
        >
          <div
            className="flex items-center gap-2 border-b border-dashed border-border px-5 py-4"
            style={{ backgroundColor: `${previewAccent.primary}12` }}
          >
            <Sparkles className="size-4 text-primary" aria-hidden />
            <h2 className="text-base font-semibold text-foreground">Así se ve en tu tienda</h2>
          </div>
          <CardContent className="p-5">
            <div className="space-y-4 rounded-lg border border-border bg-background p-4">
              <LandingBannerSection data={previewBannerData} />
              <LandingServicesSection data={previewServicesData} />
              <LandingGallerySection data={previewGalleryData} />
              <LandingVideoSection url={landingValues?.videoUrl.trim() ? landingValues.videoUrl : null} />
              {!previewBannerData &&
                previewServicesData.length === 0 &&
                previewGalleryData.length === 0 &&
                !landingValues?.videoUrl.trim() && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Sparkles className="size-5 text-foreground/40" aria-hidden />
                  <p className="text-xs text-foreground/70">
                    Configurá el banner, servicios o video para verlos acá.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
