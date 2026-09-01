'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GalleryHorizontal,
  ImageIcon,
  Palette,
  Play,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR, getAccentColor } from '@/lib/accent-colors'
import { LandingSectionsEditor, type LandingSectionsValues } from '@/components/shop/landing/landing-sections-editor'
import { LandingBannerSection, LandingGallerySection, LandingServicesSection } from '@/components/shop/landing-sections'
import { LandingVideoSection } from '@/components/shop/landing-video-section'
import { PERSONALIZATION_TEMPLATES } from '@/lib/shops/personalization-templates'
import { updateShopPersonalization, type ActionState } from '@/lib/shops/actions'
import type { getMyShop } from '@/lib/shops/queries'

type Shop = NonNullable<Awaited<ReturnType<typeof getMyShop>>>

const initialState: ActionState = { error: null }

const STEPS = [
  {
    key: 'color',
    label: 'Color',
    icon: Palette,
    help: 'Elegí el color que va a usarse en los botones y detalles de tu tienda pública.',
  },
  {
    key: 'banner',
    label: 'Banner',
    icon: ImageIcon,
    help: 'Un mensaje destacado arriba de todo, para avisar promociones o lo que más querés mostrar.',
  },
  {
    key: 'services',
    label: 'Servicios',
    icon: Sparkles,
    help: 'Los servicios que más ofrecés, para que la gente los vea apenas entra a tu tienda.',
  },
  {
    key: 'gallery',
    label: 'Galería',
    icon: GalleryHorizontal,
    help: 'Fotos de tu local, productos o trabajos, para generar confianza.',
  },
  {
    key: 'video',
    label: 'Video',
    icon: Play,
    help: 'Un video (por ejemplo de YouTube) que se muestre en tu tienda. Es opcional.',
  },
] as const

type StepKey = (typeof STEPS)[number]['key']

export function PersonalizationForm({ shop }: { shop: Shop }) {
  const { resolvedTheme } = useTheme()
  const [state, formAction, isPending] = useActionState(updateShopPersonalization, initialState)
  const isFirstRender = useRef(true)
  // Contador en vez de Date.now(): sigue dando una key única por aplicación de
  // template (fuerza el remount de LandingSectionsEditor) sin usar una fuente
  // impura dentro del cuerpo del componente.
  const templateApplyCount = useRef(0)
  const [accentColor, setAccentColor] = useState(shop.accent_color ?? DEFAULT_ACCENT_COLOR)
  const [activeStep, setActiveStep] = useState<StepKey>('color')
  const [template, setTemplate] = useState<{ key: string; banner?: { title: string; subtitle: string } } | null>(
    null
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

  function applyTemplate(templateKey: string) {
    const found = PERSONALIZATION_TEMPLATES.find((item) => item.key === templateKey)
    if (!found) return
    setAccentColor(found.accentColor)
    templateApplyCount.current += 1
    setTemplate({ key: `${found.key}-${templateApplyCount.current}`, banner: found.banner })
  }

  const selectedAccent = getAccentColor(accentColor)
  const activeStepIndex = STEPS.findIndex((step) => step.key === activeStep)
  const activeStepInfo = STEPS[activeStepIndex]
  const isFirstStep = activeStepIndex === 0
  const isLastStep = activeStepIndex === STEPS.length - 1

  function goToStep(index: number) {
    const step = STEPS[index]
    if (step) setActiveStep(step.key)
  }

  const bannerComplete = Boolean(landingValues?.bannerEnabled && landingValues.banner.title.trim())
  const servicesComplete = Boolean(landingValues?.services.some((service) => service.name.trim()))
  const galleryComplete = Boolean(landingValues?.gallery.length)
  const videoComplete = Boolean(landingValues?.videoUrl.trim())
  const completedCount =
    1 + Number(bannerComplete) + Number(servicesComplete) + Number(galleryComplete) + Number(videoComplete)

  const previewBannerData =
    landingValues?.bannerEnabled && landingValues.banner.title.trim() ? landingValues.banner : null
  const previewServicesData = landingValues?.services.filter((service) => service.name.trim()) ?? []
  const previewGalleryData = landingValues?.gallery ?? []
  const previewAccent = resolvedTheme === 'dark' ? selectedAccent.dark : selectedAccent.light

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
      <form action={formAction} className="space-y-5">
        <Card className="overflow-hidden">
          <CardContent className="space-y-3 p-5 lg:p-6">
            <div className="flex items-center gap-1.5">
              <Wand2 className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-base font-semibold text-foreground">Plantillas prearmadas</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {PERSONALIZATION_TEMPLATES.map((item) => {
                const templateAccent = getAccentColor(item.accentColor)
                const isSelected = accentColor === item.accentColor
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => applyTemplate(item.key)}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative overflow-hidden rounded-lg border p-3 text-left transition-all',
                      isSelected
                        ? 'border-transparent shadow-[0_0_0_2px_var(--tpl-color)]'
                        : 'border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm'
                    )}
                    style={{ '--tpl-color': templateAccent.swatch } as React.CSSProperties}
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: templateAccent.swatch }}
                      aria-hidden
                    />
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: templateAccent.swatch }}
                        aria-hidden
                      />
                      <p className="text-sm font-medium">{item.label}</p>
                      {isSelected && <Check className="ml-auto size-3.5 text-muted-foreground" aria-hidden />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-foreground/70">
              {completedCount}/{STEPS.length} completo
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isDone =
                (step.key === 'color' && true) ||
                (step.key === 'banner' && bannerComplete) ||
                (step.key === 'services' && servicesComplete) ||
                (step.key === 'gallery' && galleryComplete) ||
                (step.key === 'video' && videoComplete)
              const isActive = activeStep === step.key
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                    isActive
                      ? 'border-transparent bg-foreground text-background shadow-sm'
                      : 'border-border text-foreground/70 hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full text-[0.65rem]',
                      isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                    )}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <Icon className="size-3.5" aria-hidden />
                  {step.label}
                  {isDone && !isActive && <Check className="size-3.5 text-emerald-500" aria-hidden />}
                </button>
              )
            })}
          </div>
          <p className="text-sm text-foreground/70">
            Paso {activeStepIndex + 1} de {STEPS.length}: {activeStepInfo.help}
          </p>
        </div>

        <Card className={cn('transition-shadow', activeStep !== 'color' && 'hidden')}>
          <CardContent className="space-y-5 p-5 lg:p-6">
            <h2 className="text-base font-semibold text-foreground">Color de tu tienda</h2>
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

        <Card className={cn(activeStep === 'color' && 'hidden')}>
          <CardContent className="p-5 lg:p-6">
            <h2 className={cn('mb-4 text-base font-semibold text-foreground', activeStep !== 'banner' && 'hidden')}>
              Banner promocional
            </h2>
            <h2 className={cn('mb-4 text-base font-semibold text-foreground', activeStep !== 'services' && 'hidden')}>
              Servicios destacados
            </h2>
            <h2 className={cn('mb-4 text-base font-semibold text-foreground', activeStep !== 'gallery' && 'hidden')}>
              Galería de fotos
            </h2>
            <h2 className={cn('mb-4 text-base font-semibold text-foreground', activeStep !== 'video' && 'hidden')}>
              Video
            </h2>
            <div>
              <LandingSectionsEditor
                shopId={shop.id}
                landingBanner={shop.landing_banner}
                landingServices={shop.landing_services}
                landingGallery={shop.landing_gallery}
                landingVideoUrl={shop.landing_video_url}
                onChange={setLandingValues}
                applyTemplate={template}
                visibleSection={activeStep === 'color' ? 'all' : activeStep}
              />
            </div>
          </CardContent>
        </Card>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => goToStep(activeStepIndex - 1)}
            disabled={isFirstStep}
            className="min-h-10"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Atrás
          </Button>
          {!isLastStep ? (
            <Button
              type="button"
              size="lg"
              onClick={() => goToStep(activeStepIndex + 1)}
              className="min-h-10"
              style={{ backgroundColor: previewAccent.primary, color: previewAccent.primaryForeground }}
            >
              Siguiente
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="min-h-10 w-full shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          style={{ backgroundColor: previewAccent.primary, color: previewAccent.primaryForeground }}
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
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
            <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              <Sparkles className="size-3" aria-hidden />
              En vivo
            </span>
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
                  <Sparkles className="size-5 text-muted-foreground/50" aria-hidden />
                  <p className="text-xs text-muted-foreground">
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
