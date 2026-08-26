'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Check, LayoutGrid, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR, getAccentColor } from '@/lib/accent-colors'
import { LandingSectionsEditor, type LandingSectionsValues } from '@/components/shop/landing/landing-sections-editor'
import { LandingBannerSection, LandingGallerySection, LandingServicesSection } from '@/components/shop/landing-sections'
import { LandingVideoSection } from '@/components/shop/landing-video-section'
import {
  STORE_TEMPLATES,
  resolveStoreTemplate,
  type StoreTemplateKey,
} from '@/lib/shops/personalization-templates'
import { updateShopPersonalization, type ActionState } from '@/lib/shops/actions'
import type { getMyShop } from '@/lib/shops/queries'

type Shop = NonNullable<Awaited<ReturnType<typeof getMyShop>>>

const initialState: ActionState = { error: null }

export function PersonalizationForm({ shop }: { shop: Shop }) {
  const [state, formAction, isPending] = useActionState(updateShopPersonalization, initialState)
  const isFirstRender = useRef(true)
  const [accentColor, setAccentColor] = useState(shop.accent_color ?? DEFAULT_ACCENT_COLOR)
  const [template, setTemplate] = useState<StoreTemplateKey>(() =>
    resolveStoreTemplate(shop.landing_template)
  )
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

  const selectedAccent = getAccentColor(accentColor)
  const isShopmore = template === 'shopmore'

  const previewBannerData =
    landingValues?.bannerEnabled && landingValues.banner.title.trim() ? landingValues.banner : null
  const previewServicesData = landingValues?.services.filter((service) => service.name.trim()) ?? []
  const previewGalleryData = landingValues?.gallery ?? []
  const previewThemeClass = `shop-theme-preview-${shop.id}`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="landing_template" value={template} />

        <Card className="overflow-hidden">
          <CardContent className="space-y-3 p-5 lg:p-6">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-medium text-muted-foreground">Elegí una plantilla</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {STORE_TEMPLATES.map((item) => {
                const isSelected = template === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTemplate(item.key)}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative overflow-hidden rounded-lg border p-4 text-left transition-all',
                      isSelected
                        ? 'border-transparent shadow-[0_0_0_2px_var(--tpl-color)]'
                        : 'border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm'
                    )}
                    style={{ '--tpl-color': selectedAccent.swatch } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{item.label}</p>
                      {isSelected && <Check className="ml-auto size-3.5 text-muted-foreground" aria-hidden />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    <ul className="mt-2 space-y-0.5">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="size-1 shrink-0 rounded-full bg-current opacity-40" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5 lg:p-6">
            <h2 className="text-sm font-medium text-muted-foreground">Color de tu tienda</h2>
            <input type="hidden" name="accent_color" value={accentColor} />
            <div className="flex flex-wrap gap-4">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  onClick={() => setAccentColor(color.key)}
                  aria-label={color.label}
                  aria-pressed={accentColor === color.key}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all hover:scale-110',
                    accentColor === color.key ? 'scale-110 shadow-md ring-foreground' : 'ring-transparent'
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
          <CardContent className="space-y-4 p-5 lg:p-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                {isShopmore ? 'Banner y servicios' : 'Contenido de tu tienda'}
              </h2>
              {isShopmore && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cargá tu banner y los servicios que ofrecés. Las categorías y los productos
                  destacados se muestran automáticamente a partir de tu catálogo, y los horarios y
                  contacto salen de la Configuración de tu tienda.
                </p>
              )}
            </div>
            <LandingSectionsEditor
              shopId={shop.id}
              landingBanner={shop.landing_banner}
              landingServices={shop.landing_services}
              landingGallery={shop.landing_gallery}
              landingVideoUrl={shop.landing_video_url}
              onChange={setLandingValues}
              visibleSection={isShopmore ? ['banner', 'services'] : 'all'}
            />
          </CardContent>
        </Card>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button
          type="submit"
          disabled={isPending}
          className="shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: selectedAccent.light.primary, color: selectedAccent.light.primaryForeground }}
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>

      <div className="lg:sticky lg:top-4">
        <Card className={cn('overflow-hidden border-dashed', previewThemeClass)}>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                .${previewThemeClass} { --primary: ${selectedAccent.light.primary}; --primary-foreground: ${selectedAccent.light.primaryForeground}; }
                .dark .${previewThemeClass} { --primary: ${selectedAccent.dark.primary}; --primary-foreground: ${selectedAccent.dark.primaryForeground}; }
              `,
            }}
          />
          <div
            className="flex items-center gap-2 border-b border-dashed border-border px-5 py-4"
            style={{ backgroundColor: `${selectedAccent.light.primary}12` }}
          >
            <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              <Sparkles className="size-3" aria-hidden />
              En vivo
            </span>
            <h2 className="text-sm font-medium text-muted-foreground">Así se ve en tu tienda</h2>
          </div>
          <CardContent className="p-5">
            <div className="space-y-4 rounded-lg border border-border bg-background p-4">
              <LandingBannerSection data={previewBannerData} />
              {isShopmore ? (
                <>
                  <ShopmorePreviewBlock label="Categorías que vendés" />
                  <ShopmorePreviewBlock label="Destacados" />
                  <ShopmorePreviewBlock label="Todos los productos" />
                  <LandingServicesSection data={previewServicesData} />
                  {!previewBannerData && (
                    <p className="text-center text-xs text-muted-foreground">
                      Subí un banner para completar tu portada.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <LandingServicesSection data={previewServicesData} />
                  <LandingGallerySection data={previewGalleryData} />
                  <LandingVideoSection url={landingValues?.videoUrl.trim() ? landingValues.videoUrl : null} />
                  {!previewBannerData &&
                    previewServicesData.length === 0 &&
                    previewGalleryData.length === 0 &&
                    !landingValues?.videoUrl.trim() && (
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <Sparkles className="size-5 text-muted-foreground/50" aria-hidden />
                        <p className="text-xs text-muted-foreground">
                          Configurá el banner, servicios o video para verlos acá.
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** Placeholder de un bloque automático (categorías/destacados/productos) que se
 * llena con datos reales del catálogo en la tienda pública. */
function ShopmorePreviewBlock({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-16 flex-1 rounded-lg bg-muted" aria-hidden />
        ))}
      </div>
    </div>
  )
}
