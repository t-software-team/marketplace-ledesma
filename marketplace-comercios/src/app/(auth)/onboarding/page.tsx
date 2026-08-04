'use client'

import { ShoppingBag, Store } from 'lucide-react'
import { unstable_rethrow } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { selectUserRole } from '@/lib/auth/actions'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null)

  async function selectRole(role: UserRole) {
    setError(null)
    setLoadingRole(role)

    try {
      const result = await selectUserRole(role)

      if (result?.error) {
        setError(result.error)
        setLoadingRole(null)
      }
      // On success selectUserRole redirects server-side; this component unmounts.
    } catch (err) {
      unstable_rethrow(err)
      console.error('selectRole: unexpected error', err)
      setError('No pudimos guardar tu elección. Intentá de nuevo.')
      setLoadingRole(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-2">
      <div className="text-center">
        <h1 className="text-2xl font-heading">¿Qué querés hacer?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elegí cómo vas a usar el marketplace
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => selectRole('client')}
          disabled={loadingRole !== null}
          className="text-left"
        >
          <Card className="h-full transition-colors hover:ring-primary/40">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/20">
                <ShoppingBag className="size-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-heading text-lg">Quiero comprar</p>
                <p className="mt-1 text-sm text-muted-foreground">Cliente</p>
              </div>
              <ul className="space-y-1 text-left text-xs text-muted-foreground">
                <li>• Descubrí comercios y productos cerca tuyo</li>
                <li>• Contactá por WhatsApp en un toque</li>
                <li>• Guardá tus favoritos y seguí comercios</li>
              </ul>
              <Button
                render={<span />}
                nativeButton={false}
                disabled={loadingRole === 'client'}
                variant="outline"
                className="mt-2"
              >
                {loadingRole === 'client' ? 'Guardando...' : 'Elegir'}
              </Button>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => selectRole('shop_admin')}
          disabled={loadingRole !== null}
          className="text-left"
        >
          <Card className="h-full transition-colors hover:ring-primary/40">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destacado/30">
                <Store className="size-6 text-destacado-foreground" />
              </div>
              <div>
                <p className="font-heading text-lg">Quiero vender</p>
                <p className="mt-1 text-sm text-muted-foreground">Comercio</p>
              </div>
              <ul className="space-y-1 text-left text-xs text-muted-foreground">
                <li>• Creá tu tienda y cargá tus productos</li>
                <li>• Aparecé en el feed y en búsquedas</li>
                <li>• Recibí contactos directo por WhatsApp</li>
              </ul>
              <Button
                render={<span />}
                nativeButton={false}
                disabled={loadingRole === 'shop_admin'}
                className="mt-2"
              >
                {loadingRole === 'shop_admin' ? 'Guardando...' : 'Elegir'}
              </Button>
            </CardContent>
          </Card>
        </button>
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
