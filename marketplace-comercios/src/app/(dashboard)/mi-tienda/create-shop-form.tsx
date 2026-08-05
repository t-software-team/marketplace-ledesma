'use client'

import { useActionState, useMemo, useState } from 'react'
import { Store, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createShop, type ActionState } from '@/lib/shops/actions'
import { slugify } from '@/lib/slugify'
import { getRubroIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

const initialState: ActionState = { error: null }

type Category = { id: string; name: string; slug: string; is_service: boolean | null }

interface CreateShopFormProps {
  categories: Category[]
}

type Kind = 'comercio' | 'servicio' | null

export function CreateShopForm({ categories }: CreateShopFormProps) {
  const [state, formAction, isPending] = useActionState(createShop, initialState)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [kind, setKind] = useState<Kind>(null)
  const [categoryId, setCategoryId] = useState('')

  const filteredCategories = useMemo(() => {
    if (!kind) return []
    const wantsService = kind === 'servicio'
    return categories.filter((category) => Boolean(category.is_service) === wantsService)
  }, [categories, kind])

  if (!kind) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setKind('comercio')}
          className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface p-4 text-center transition-colors hover:border-primary"
        >
          <Store className="size-7 text-primary" aria-hidden />
          <span className="font-medium">Comercio</span>
          <span className="text-xs text-muted-foreground">Vendo productos</span>
        </button>
        <button
          type="button"
          onClick={() => setKind('servicio')}
          className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface p-4 text-center transition-colors hover:border-primary"
        >
          <Wrench className="size-7 text-primary" aria-hidden />
          <span className="font-medium">Servicio</span>
          <span className="text-xs text-muted-foreground">Ofrezco servicios</span>
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <button
        type="button"
        onClick={() => setKind(null)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ‹ Volver
      </button>

      <div className="grid grid-cols-2 gap-3">
        {(['comercio', 'servicio'] as const).map((option) => {
          const Icon = option === 'comercio' ? Store : Wrench
          const isSelected = kind === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={cn(
                'flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-center transition-colors',
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary'
              )}
            >
              <Icon className="size-7 text-primary" aria-hidden />
              <span className="font-medium">{option === 'comercio' ? 'Comercio' : 'Servicio'}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre de la tienda
        </label>
        <Input
          id="name"
          name="name"
          required
          onChange={(event) => {
            if (!slugTouched) setSlug(slugify(event.target.value))
          }}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium">
          Link de tu tienda
        </label>
        <Input
          id="slug"
          name="slug"
          placeholder="mi-tienda"
          required
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={slug}
          onChange={(event) => {
            setSlugTouched(true)
            setSlug(event.target.value.toLowerCase())
          }}
        />
        <p className="text-xs text-muted-foreground">
          Así te van a encontrar tus clientes: proxi.com/tienda/{slug || 'tu-tienda'}. Se
          completa solo con el nombre, pero podés editarlo.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="whatsapp_number" className="text-sm font-medium">
          WhatsApp
        </label>
        <Input id="whatsapp_number" name="whatsapp_number" placeholder="5493886000000" required />
        <p className="text-xs text-muted-foreground">
          Código de país + 9 + número, sin 0 ni 15. Ej: 5493886000000
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rubro</label>
        <input type="hidden" name="category_id" value={categoryId} />
        <div className="flex flex-wrap gap-2">
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
              </button>
            )
          })}
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending || !categoryId}>
        {isPending ? 'Creando...' : kind === 'servicio' ? 'Crear servicio' : 'Crear comercio'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Tranquilo, podés cambiar todo esto más adelante desde la configuración de tu tienda.
      </p>
    </form>
  )
}
