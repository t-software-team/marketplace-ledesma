'use client'

import { Search } from 'lucide-react'
import { useActionState, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { ProductImagesField } from '@/components/shared/product-images-field'
import { ProductVideoField } from '@/components/shared/product-video-field'
import { ProductVariantsField } from '@/components/shared/product-variants-field'
import { ProductAttributesFields, type AttributeDef } from '@/components/shared/product-attributes-fields'
import { PriceInput } from '@/components/shared/price-input'
import { SuggestCategoryDialog } from '@/components/shared/suggest-category-dialog'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/shops/actions'

interface ProductFormProps {
  shopId: string
  shopRubroId?: string | null
  categories: { id: string; name: string }[]
  attributeDefs?: AttributeDef[]
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: {
    name: string
    description: string | null
    price: number | null
    stock?: number | null
    currency: string
    category_id: string | null
    is_active: boolean
    image_urls: string[]
    videoUrl?: string | null
    variants?: { name: string; price: number }[]
    attributes?: Record<string, string | string[]>
  }
  submitLabel: string
  isService?: boolean
  videoLimitReached?: boolean
  maxImages?: number
  maxVariants?: number
}

const initialState: ActionState = { error: null }

export function ProductForm({
  shopId,
  shopRubroId = null,
  categories,
  attributeDefs = [],
  action,
  defaultValues,
  submitLabel,
  isService = false,
  videoLimitReached = false,
  maxImages = 3,
  maxVariants = 3,
}: ProductFormProps) {
  const noun = isService ? 'servicio' : 'producto'
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id ?? '')
  const [categorySearch, setCategorySearch] = useState('')
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.name.toLowerCase().includes(query))
  }, [categories, categorySearch])
  const fieldErrors = state.fieldErrors ?? {}

  useEffect(() => {
    if (state.error) {
      toast.add({ title: `No pudimos guardar el ${noun}`, description: state.error, type: 'error' })
    }
  }, [state, noun])

  return (
    <form action={formAction} className="space-y-6 pb-20 sm:pb-4">
      <section className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-base font-medium sm:text-sm">
            Nombre
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            required
            aria-invalid={Boolean(fieldErrors.name)}
          />
          <p className="text-xs text-muted-foreground">
            Usá un nombre claro y concreto — así tus clientes lo encuentran más fácil. Ej: &quot;Zapatillas
            urbanas talle 42&quot;.
          </p>
          <FieldError message={fieldErrors.name} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="price" className="text-base font-medium sm:text-sm">
              {isService ? 'Precio del servicio' : 'Precio'}
            </label>
            <PriceInput
              id="price"
              name="price"
              defaultValue={defaultValues?.price ?? ''}
              aria-invalid={Boolean(fieldErrors.price)}
            />
            <p className="text-xs text-muted-foreground">Dejalo vacío si preferís que digan &quot;Consultar precio&quot;.</p>
            <FieldError message={fieldErrors.price} />
          </div>
          <div className="space-y-2">
            <label htmlFor="currency" className="text-base font-medium sm:text-sm">
              Moneda
            </label>
            <Input
              id="currency"
              name="currency"
              defaultValue={defaultValues?.currency ?? 'ARS'}
              aria-invalid={Boolean(fieldErrors.currency)}
            />
            <p className="text-xs text-muted-foreground">Normalmente ARS (pesos argentinos).</p>
            <FieldError message={fieldErrors.currency} />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="stock" className="text-base font-medium sm:text-sm">
            Stock
          </label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.stock ?? ''}
            aria-invalid={Boolean(fieldErrors.stock)}
          />
          <p className="text-xs text-muted-foreground">
            Dejalo vacío si no querés controlar el stock disponible.
          </p>
          <FieldError message={fieldErrors.stock} />
        </div>

        <div className="space-y-2">
          <label id="description-label" className="text-base font-medium sm:text-sm">
            Descripción
          </label>
          <RichTextEditor
            name="description"
            initialValue={defaultValues?.description ?? ''}
            ariaLabelledBy="description-label"
          />
          <p className="text-xs text-muted-foreground">
            Contá lo que a tu cliente le sirve saber: material, talles o colores disponibles, tiempo de
            entrega, etc.
          </p>
          <FieldError message={fieldErrors.description} />
        </div>

        <ProductVariantsField
          initialVariants={defaultValues?.variants}
          noun={noun}
          isService={isService}
          maxVariants={maxVariants}
        />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="font-heading text-base">Imágenes y video</h2>

        <ProductImagesField
          shopId={shopId}
          initialImages={defaultValues?.image_urls}
          noun={noun}
          maxImages={maxImages}
        />

        <ProductVideoField
          shopId={shopId}
          initialVideoUrl={defaultValues?.videoUrl}
          noun={noun}
          videoLimitReached={videoLimitReached}
        />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="font-heading text-base">Clasificación</h2>

        <fieldset className="m-0 min-w-0 border-0 p-0 space-y-2">
          <legend className="text-base font-medium sm:text-sm">Subcategoría</legend>
          <input type="hidden" name="category_id" value={categoryId} />
          {categories.length > 0 && (
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar subcategoría..."
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                className="h-10 pl-9"
                aria-label="Buscar subcategoría"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {categories.length > 0 && filteredCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">No encontramos ninguna subcategoría con ese nombre.</p>
            )}
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  categoryId === category.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                )}
              >
                {category.name}
              </button>
            ))}
            <SuggestCategoryDialog
              parentId={shopRubroId}
              existingNames={categories.map((category) => category.name)}
            />
          </div>
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay subcategorías para el rubro de tu comercio todavía.
            </p>
          )}
          <FieldError message={fieldErrors.category_id} />
        </fieldset>

        <ProductAttributesFields attributeDefs={attributeDefs} initialValues={defaultValues?.attributes} />

        <div className="mt-4 space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              name="is_active"
              value="on"
              defaultChecked={defaultValues?.is_active ?? true}
            />
            <label htmlFor="is_active" className="text-base font-medium sm:text-sm">
              {isService ? 'Servicio activo' : 'Producto activo'}
            </label>
          </div>
          <p className="pl-6 text-xs text-muted-foreground">
            Si lo desmarcás, dejás de mostrarlo en el feed y en tu tienda pública, pero no lo borrás —
            podés volver a activarlo cuando quieras.
          </p>
        </div>
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface p-4 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
