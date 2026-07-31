'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/shared/field-error'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { SuggestCategoryDialog } from '@/components/shared/suggest-category-dialog'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { getRubroIcon, isServiceRubro } from '@/lib/category-icons'
import { uploadShopImage } from '@/lib/shops/upload-image'
import { slugify } from '@/lib/slugify'
import { updateShopSettings, type ActionState } from '@/lib/shops/actions'
import { BusinessHoursEditor } from './business-hours-editor'
import type { getMyShop } from '@/lib/shops/queries'

type Shop = NonNullable<Awaited<ReturnType<typeof getMyShop>>>

interface ShopSettingsFormProps {
  shop: Shop
  categories: { id: string; name: string; slug: string }[]
}

const initialState: ActionState = { error: null }

export function ShopSettingsForm({ shop, categories }: ShopSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateShopSettings, initialState)
  const fieldErrors = state.fieldErrors ?? {}
  const isFirstRender = useRef(true)

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
  const [logoUrl, setLogoUrl] = useState(shop.logo_url ?? '')
  const [coverUrl, setCoverUrl] = useState(shop.cover_url ?? '')
  const [isPaused, setIsPaused] = useState(shop.is_paused)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState(shop.category_id ?? '')
  const [categorySearch, setCategorySearch] = useState('')
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.name.toLowerCase().includes(query))
  }, [categories, categorySearch])
  const [slug, setSlug] = useState(shop.slug)
  // If the current slug doesn't match what auto-slugifying the name would
  // produce, the shop already has a manually customized URL — don't
  // silently overwrite it just because they tweaked the name.
  const [slugTouched, setSlugTouched] = useState(shop.slug !== slugify(shop.name))

  async function handleUpload(
    bucket: 'shop-logos' | 'shop-covers',
    setter: (url: string) => void,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    try {
      const url = await uploadShopImage(bucket, shop.id, file)
      setter(url)
    } catch (error) {
      console.error('ShopSettingsForm: fallo al subir imagen', { bucket, error })
      setUploadError(error instanceof Error ? error.message : 'No pudimos subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="logo_url" value={logoUrl} />
      <input type="hidden" name="cover_url" value={coverUrl} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-base font-medium sm:text-sm text-muted-foreground">Datos generales</h2>

          <div className="space-y-2">
            <label htmlFor="name" className="text-base font-medium sm:text-sm">
              Nombre
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={shop.name}
              required
              aria-invalid={Boolean(fieldErrors.name)}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value))
              }}
            />
            <p className="text-xs text-muted-foreground">
              El nombre de tu comercio tal como lo conocen tus clientes.
            </p>
            <FieldError message={fieldErrors.name} />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-base font-medium sm:text-sm">
              Link de tu tienda
            </label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              required
              aria-invalid={Boolean(fieldErrors.slug)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(event.target.value.toLowerCase())
              }}
            />
            <p className="text-xs text-muted-foreground">
              Así te van a encontrar tus clientes: marketplace-ledesma.com/tienda/{slug || 'tu-tienda'}.
              Se completa solo con el nombre, pero podés editarlo. Ojo: si la cambiás, los links que ya
              compartiste van a dejar de funcionar.
            </p>
            <FieldError message={fieldErrors.slug} />
          </div>

          <div className="space-y-2">
            <label className="text-base font-medium sm:text-sm">Descripción</label>
            <RichTextEditor name="description" initialValue={shop.description ?? ''} />
            <p className="text-xs text-muted-foreground">
              Contales a tus clientes qué vendés, hace cuánto existís y qué te distingue.
            </p>
            <FieldError message={fieldErrors.description} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-base font-medium sm:text-sm text-muted-foreground">Contacto y ubicación</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="whatsapp_number" className="text-base font-medium sm:text-sm">
                WhatsApp
              </label>
              <Input
                id="whatsapp_number"
                name="whatsapp_number"
                placeholder="5493886000000"
                defaultValue={shop.whatsapp_number}
                required
                aria-invalid={Boolean(fieldErrors.whatsapp_number)}
              />
              <p className="text-xs text-muted-foreground">
                Código de país + 9 + número, sin 0 ni 15 (ej: 5493886000000)
              </p>
              <FieldError message={fieldErrors.whatsapp_number} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-base font-medium sm:text-sm">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={shop.email ?? ''}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              <FieldError message={fieldErrors.email} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="address" className="text-base font-medium sm:text-sm">
                Dirección
              </label>
              <Input id="address" name="address" defaultValue={shop.address ?? ''} />
              <FieldError message={fieldErrors.address} />
            </div>
            <div className="space-y-2">
              <label htmlFor="city" className="text-base font-medium sm:text-sm">
                Ciudad
              </label>
              <Input id="city" name="city" defaultValue={shop.city ?? ''} />
              <FieldError message={fieldErrors.city} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="instagram_url" className="text-base font-medium sm:text-sm">
                Instagram (URL)
              </label>
              <Input
                id="instagram_url"
                name="instagram_url"
                placeholder="https://instagram.com/tu-comercio"
                defaultValue={shop.instagram_url ?? ''}
                aria-invalid={Boolean(fieldErrors.instagram_url)}
              />
              <FieldError message={fieldErrors.instagram_url} />
            </div>
            <div className="space-y-2">
              <label htmlFor="facebook_url" className="text-base font-medium sm:text-sm">
                Facebook (URL)
              </label>
              <Input
                id="facebook_url"
                name="facebook_url"
                placeholder="https://facebook.com/tu-comercio"
                defaultValue={shop.facebook_url ?? ''}
                aria-invalid={Boolean(fieldErrors.facebook_url)}
              />
              <FieldError message={fieldErrors.facebook_url} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="website_url" className="text-base font-medium sm:text-sm">
              Sitio web
            </label>
            <Input
              id="website_url"
              name="website_url"
              placeholder="https://tu-comercio.com"
              defaultValue={shop.website_url ?? ''}
              aria-invalid={Boolean(fieldErrors.website_url)}
            />
            <FieldError message={fieldErrors.website_url} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-base font-medium sm:text-sm text-muted-foreground">Rubro y horario</h2>

          <div className="space-y-2">
            <label className="text-base font-medium sm:text-sm">Rubro</label>
            <input type="hidden" name="category_id" value={categoryId} />
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar rubro..."
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                className="h-10 pl-9"
                aria-label="Buscar rubro"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">No encontramos ningún rubro con ese nombre.</p>
              )}
              {filteredCategories.map((category) => {
                const Icon = getRubroIcon(category.slug)
                const isSelected = categoryId === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id === categoryId ? '' : category.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {category.name}
                    {isServiceRubro(category.slug) && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        Servicio
                      </span>
                    )}
                  </button>
                )
              })}
              <SuggestCategoryDialog
                parentId={null}
                existingNames={categories.map((category) => category.name)}
                noun="rubro"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Define qué subcategorías vas a poder elegir al cargar productos. ¿No encontrás el tuyo?
              Sugerí uno nuevo.
            </p>
            <FieldError message={fieldErrors.category_id} />
          </div>

          <BusinessHoursEditor businessHours={shop.business_hours} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-base font-medium sm:text-sm text-muted-foreground">Imágenes</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="logo" className="text-base font-medium sm:text-sm">
                Logo
              </label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(event) => handleUpload('shop-logos', setLogoUrl, event)}
              />
              {logoUrl && (
                <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="64px" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="cover" className="text-base font-medium sm:text-sm">
                Portada
              </label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(event) => handleUpload('shop-covers', setCoverUrl, event)}
              />
              {coverUrl && (
                <div className="relative h-16 w-full overflow-hidden rounded-lg bg-muted">
                  <Image src={coverUrl} alt="Portada" fill className="object-cover" sizes="200px" />
                </div>
              )}
            </div>
          </div>
          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-base font-medium sm:text-sm">Personalizá tu tienda pública</p>
            <p className="text-xs text-muted-foreground">
              Color de acento, banner promocional, servicios destacados y video.
            </p>
          </div>
          <Button render={<Link href="/mi-tienda/personalizar" />} nativeButton={false} variant="outline" size="sm">
            Ir a Personalizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <h2 className="text-base font-medium sm:text-sm text-muted-foreground">Estado</h2>

          <label className="flex items-center gap-2 text-base font-medium sm:text-sm">
            <input
              type="checkbox"
              name="is_paused"
              checked={isPaused}
              onChange={(event) => setIsPaused(event.target.checked)}
              className="size-4"
            />
            Pausar tienda
          </label>
          <p className="pl-6 text-xs text-muted-foreground">
            Tu tienda deja de verse en el feed y no se puede comprar mientras esté en pausa. Usalo si
            te vas de vacaciones o te quedaste sin stock — podés reactivarla cuando quieras.
          </p>
          {isPaused && (
            <Input
              name="paused_reason"
              placeholder="Motivo de la pausa"
              defaultValue={shop.paused_reason ?? ''}
              aria-label="Motivo de pausa"
            />
          )}
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.warning && (
        <p className="rounded-lg border border-warning bg-warning/30 p-3 text-sm text-warning-foreground">
          {state.warning}
        </p>
      )}

      <Button type="submit" disabled={isPending || isUploading}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
