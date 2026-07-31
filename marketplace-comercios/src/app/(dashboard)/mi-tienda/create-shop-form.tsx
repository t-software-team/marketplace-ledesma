'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createShop, type ActionState } from '@/lib/shops/actions'
import { slugify } from '@/lib/slugify'

const initialState: ActionState = { error: null }

export function CreateShopForm() {
  const [state, formAction, isPending] = useActionState(createShop, initialState)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  return (
    <form action={formAction} className="space-y-4">
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

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear mi tienda'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Tranquilo, podés cambiar todo esto más adelante desde la configuración de tu tienda.
      </p>
    </form>
  )
}
