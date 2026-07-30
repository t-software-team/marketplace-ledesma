'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductImagesField } from '@/components/shared/product-images-field'
import { ProductVideoField } from '@/components/shared/product-video-field'
import { ProductVariantsField } from '@/components/shared/product-variants-field'
import { ProductAttributesFields, type AttributeDef } from '@/components/shared/product-attributes-fields'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/shops/actions'

interface ProductFormProps {
  shopId: string
  categories: { id: string; name: string }[]
  attributeDefs?: AttributeDef[]
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: {
    name: string
    description: string | null
    price: number | null
    currency: string
    category_id: string | null
    is_active: boolean
    imageUrls: string[]
    videoUrl?: string | null
    variants?: { name: string; price: number }[]
    attributes?: Record<string, string | string[]>
  }
  submitLabel: string
  isService?: boolean
}

const initialState: ActionState = { error: null }

export function ProductForm({
  shopId,
  categories,
  attributeDefs = [],
  action,
  defaultValues,
  submitLabel,
  isService = false,
}: ProductFormProps) {
  const noun = isService ? 'servicio' : 'producto'
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id ?? '')
  const fieldErrors = state.fieldErrors ?? {}

  useEffect(() => {
    if (state.error) {
      toast.add({ title: `No pudimos guardar el ${noun}`, description: state.error, type: 'error' })
    }
  }, [state, noun])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
          aria-invalid={Boolean(fieldErrors.name)}
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ''}
        />
        <FieldError message={fieldErrors.description} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            {isService ? 'Precio del servicio' : 'Precio'}
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.price ?? ''}
            aria-invalid={Boolean(fieldErrors.price)}
          />
          <FieldError message={fieldErrors.price} />
        </div>
        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm font-medium">
            Moneda
          </label>
          <Input
            id="currency"
            name="currency"
            defaultValue={defaultValues?.currency ?? 'ARS'}
            aria-invalid={Boolean(fieldErrors.currency)}
          />
          <FieldError message={fieldErrors.currency} />
        </div>
      </div>
      <ProductVariantsField
        initialVariants={defaultValues?.variants}
        noun={noun}
        isService={isService}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Subcategoría</label>
        <input type="hidden" name="category_id" value={categoryId} />
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
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
        </div>
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay subcategorías para el rubro de tu comercio todavía.
          </p>
        )}
        <FieldError message={fieldErrors.category_id} />
      </div>

      <ProductAttributesFields attributeDefs={attributeDefs} initialValues={defaultValues?.attributes} />

      <ProductImagesField shopId={shopId} initialImages={defaultValues?.imageUrls} noun={noun} />

      <ProductVideoField shopId={shopId} initialVideoUrl={defaultValues?.videoUrl} noun={noun} />


      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValues?.is_active ?? true}
          className="size-4"
        />
        {isService ? 'Servicio activo' : 'Producto activo'}
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  )
}
