'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { toast } from '@/components/ui/toast'
import { GYM_RUBRO_SLUG } from '@/lib/category-icons'
import type { ActionState } from '@/lib/admin/actions/shared'

interface PlanBenefits {
  max_products?: number | null
  max_videos?: number | null
  featured?: boolean
  analytics?: boolean
  priority_support?: boolean
  custom_branding?: boolean
  promotions?: boolean
  verified_badge?: boolean
  gym_freeze?: boolean
  gym_export?: boolean
  gym_stats?: boolean
}

interface PlanCategory {
  id: string
  name: string
  slug?: string | null
}

interface PlanFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  categories: PlanCategory[]
  defaultValues?: {
    name: string
    description: string | null
    price: number
    duration_days: number
    benefits: unknown
    is_active: boolean
    applies_to?: string
    category_id?: string | null
    max_products_service?: number | null
    max_products_product?: number | null
    max_images?: number | null
    max_variants?: number | null
    max_gym_members?: number | null
  }
  /** Preselects the rubro on a new plan (e.g. from "+ Nuevo plan" of a rubro). */
  defaultCategoryId?: string
  submitLabel: string
}

// Perks any shop can get, regardless of rubro.
const GENERIC_CHECKBOXES = [
  { name: 'featured', label: 'Destacar en el feed' },
  { name: 'verified_badge', label: 'Ícono de comercio verificado' },
  { name: 'analytics', label: 'Estadísticas de la tienda' },
  { name: 'priority_support', label: 'Soporte prioritario' },
  { name: 'custom_branding', label: 'Personalización de tienda pública' },
] as const

// Perks specific to product/service commerce (hidden for a gym plan).
const COMERCIO_CHECKBOXES = [{ name: 'promotions', label: 'Promociones destacadas en el feed' }] as const

// Perks specific to the gym vertical (hidden for a commerce plan).
const GYM_CHECKBOXES = [
  { name: 'gym_freeze', label: 'Congelar membresías de socios' },
  { name: 'gym_export', label: 'Exportar socios y pagos a CSV' },
  { name: 'gym_stats', label: 'Estadísticas de asistencia' },
] as const

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'Todos los rubros' },
  { value: 'product', label: 'Solo productos' },
  { value: 'service', label: 'Solo servicios' },
]

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const initialState: ActionState = { error: null }

export function PlanForm({
  action,
  categories,
  defaultValues,
  defaultCategoryId,
  submitLabel,
}: PlanFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [price, setPrice] = useState(defaultValues?.price ?? 0)
  const isFreePlan = price === 0
  const benefits = (defaultValues?.benefits ?? {}) as PlanBenefits

  // Rubro drives which fields are relevant. 'general' = a commerce plan scoped by
  // applies_to; a category id = a plan exclusive to that rubro (e.g. Gimnasio).
  const initialRubro = defaultValues?.category_id ?? defaultCategoryId ?? 'general'
  const [rubro, setRubro] = useState(
    categories.some((c) => c.id === initialRubro) ? initialRubro : 'general'
  )
  const isGeneral = rubro === 'general'
  const selectedCategory = categories.find((c) => c.id === rubro)
  const isGym = selectedCategory?.slug === GYM_RUBRO_SLUG

  useEffect(() => {
    if (state.error) {
      toast.add({ title: 'No pudimos guardar el plan', description: state.error, type: 'error' })
    }
  }, [state])

  const renderCheckbox = ({ name, label }: { name: keyof PlanBenefits; label: string }) => (
    <label key={name} className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={`benefits_${name}`}
        defaultChecked={Boolean(benefits[name])}
        className="size-4"
      />
      {label}
    </label>
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>

      <div className="space-y-2">
        <label id="plan-description-label" className="text-sm font-medium">
          Descripción
        </label>
        <RichTextEditor
          name="description"
          initialValue={defaultValues?.description ?? ''}
          ariaLabelledBy="plan-description-label"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Precio
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.price}
            onChange={(event) => setPrice(Number(event.target.value) || 0)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="duration_days" className="text-sm font-medium">
            Duración (días)
          </label>
          <Input
            id="duration_days"
            name="duration_days"
            type="number"
            min="1"
            step="1"
            defaultValue={defaultValues?.duration_days}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="rubro" className="text-sm font-medium">
          Rubro del plan
        </label>
        <select
          id="rubro"
          value={rubro}
          onChange={(event) => setRubro(event.target.value)}
          className={selectClass}
        >
          <option value="general">Comercios (todos los rubros)</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="category_id" value={isGeneral ? '' : rubro} />
        <p className="text-xs text-muted-foreground">
          {isGeneral
            ? 'El plan se ofrece a los comercios según "Aplica a".'
            : `Plan exclusivo del rubro ${selectedCategory?.name ?? ''}. No se muestra a otros rubros.`}
        </p>
      </div>

      {isGeneral ? (
        <div className="space-y-2">
          <label htmlFor="applies_to" className="text-sm font-medium">
            Aplica a
          </label>
          <select
            id="applies_to"
            name="applies_to"
            defaultValue={defaultValues?.applies_to ?? 'all'}
            className={selectClass}
          >
            {APPLIES_TO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Los comercios de rubros de servicio solo ven planes &quot;Todos&quot; o &quot;Solo
            servicios&quot;; el resto solo ve &quot;Todos&quot; o &quot;Solo productos&quot;.
          </p>
        </div>
      ) : (
        <input type="hidden" name="applies_to" value="all" />
      )}

      <div className="space-y-3 rounded-lg border border-input p-3">
        <p className="text-sm font-medium">Beneficios</p>

        <div className="grid grid-cols-2 gap-2">{GENERIC_CHECKBOXES.map(renderCheckbox)}</div>

        {!isGym && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="benefits_max_products" className="text-sm font-medium">
                  Máx. productos
                </label>
                <Input
                  id="benefits_max_products"
                  name="benefits_max_products"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Sin límite"
                  defaultValue={benefits.max_products ?? undefined}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="benefits_max_videos" className="text-sm font-medium">
                  Máx. videos
                </label>
                <Input
                  id="benefits_max_videos"
                  name="benefits_max_videos"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Sin límite"
                  defaultValue={benefits.max_videos ?? undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">{COMERCIO_CHECKBOXES.map(renderCheckbox)}</div>
          </>
        )}

        {isGym && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">{GYM_CHECKBOXES.map(renderCheckbox)}</div>
            <div className="w-1/2 space-y-2 pr-2">
              <label htmlFor="max_gym_members" className="text-sm font-medium">
                Máx. socios
              </label>
              <Input
                id="max_gym_members"
                name="max_gym_members"
                type="number"
                min="0"
                step="1"
                placeholder="Sin límite"
                defaultValue={defaultValues?.max_gym_members ?? undefined}
              />
            </div>
          </div>
        )}
      </div>

      {!isGym && isFreePlan && (
        <div className="space-y-2 rounded-lg border border-input p-3">
          <p className="text-sm font-medium">Límites del plan gratuito (opcional)</p>
          <p className="text-xs text-muted-foreground">
            Dejá vacío para que el plan use el respaldo por defecto (imágenes/variantes) o no tenga
            límite de productos. Se guardan en la tabla plan_limits, también usada por la app mobile.
            Para planes pagos, el límite de productos se define arriba en &quot;Beneficios&quot;.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="max_products_service" className="text-sm font-medium">
                Máx. productos (rubro servicio)
              </label>
              <Input
                id="max_products_service"
                name="max_products_service"
                type="number"
                min="0"
                step="1"
                placeholder="Sin límite"
                defaultValue={defaultValues?.max_products_service ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="max_products_product" className="text-sm font-medium">
                Máx. productos (rubro producto)
              </label>
              <Input
                id="max_products_product"
                name="max_products_product"
                type="number"
                min="0"
                step="1"
                placeholder="Sin límite"
                defaultValue={defaultValues?.max_products_product ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="max_images" className="text-sm font-medium">
                Máx. imágenes por producto
              </label>
              <Input
                id="max_images"
                name="max_images"
                type="number"
                min="0"
                step="1"
                placeholder="Usar valor por defecto"
                defaultValue={defaultValues?.max_images ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="max_variants" className="text-sm font-medium">
                Máx. variantes por producto
              </label>
              <Input
                id="max_variants"
                name="max_variants"
                type="number"
                min="0"
                step="1"
                placeholder="Usar valor por defecto"
                defaultValue={defaultValues?.max_variants ?? undefined}
              />
            </div>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValues?.is_active ?? true}
          className="size-4"
        />
        Plan activo
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  )
}
