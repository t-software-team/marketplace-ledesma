'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createShop, type ActionState } from '@/lib/shops/actions'

const initialState: ActionState = { error: null }

export function CreateShopForm() {
  const [state, formAction, isPending] = useActionState(createShop, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre de la tienda
        </label>
        <Input id="name" name="name" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium">
          URL (slug)
        </label>
        <Input id="slug" name="slug" placeholder="mi-tienda" required />
        <p className="text-xs text-muted-foreground">
          Se usará como marketplace-ledesma.com/tienda/tu-slug
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="whatsapp_number" className="text-sm font-medium">
          WhatsApp
        </label>
        <Input id="whatsapp_number" name="whatsapp_number" placeholder="5493886000000" required />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear mi tienda'}
      </Button>
    </form>
  )
}
