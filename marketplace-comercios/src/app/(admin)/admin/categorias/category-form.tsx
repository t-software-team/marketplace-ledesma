'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/admin/actions'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CategoryFormProps {
  categories: { id: string; name: string }[]
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: {
    name: string
    slug: string
    parent_id: string | null
    is_active: boolean
  }
  submitLabel: string
  currentCategoryId?: string
}

const initialState: ActionState = { error: null }

export function CategoryForm({
  categories,
  action,
  defaultValues,
  submitLabel,
  currentCategoryId,
}: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.error) {
      toast.add({ title: 'No pudimos guardar la categoría', description: state.error, type: 'error' })
    }
  }, [state])

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug))
  const [parentId, setParentId] = useState(defaultValues?.parent_id ?? '')

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true)
    setSlug(slugify(event.target.value))
  }

  const parentOptions = categories.filter((category) => category.id !== currentCategoryId)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <Input id="name" name="name" value={name} onChange={handleNameChange} required />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium">
          URL
        </label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={handleSlugChange}
          required
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Identificador único usado internamente para filtrar productos por esta categoría. Se
          genera solo a partir del nombre, pero podés ajustarlo.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Categoría padre</label>
        <input type="hidden" name="parent_id" value={parentId} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParentId('')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
              parentId === ''
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            )}
          >
            Sin categoría padre
          </button>
          {parentOptions.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setParentId(category.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                parentId === category.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValues?.is_active ?? true}
          className="size-4"
        />
        Categoría activa
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  )
}
