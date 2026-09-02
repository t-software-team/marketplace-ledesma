'use client'

import { ShoppingBag, Store } from 'lucide-react'
import Link from 'next/link'
import { unstable_rethrow } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { selectUserRole } from '@/lib/auth/actions'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export function RoleSelector() {
  const [error, setError] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  async function selectRole(role: UserRole) {
    if (!acceptedTerms) {
      setError('Tenés que aceptar los términos y condiciones')
      return
    }

    setError(null)
    setLoadingRole(role)

    try {
      const result = await selectUserRole(role, acceptedTerms)

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
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => selectRole('client')}
          disabled={loadingRole !== null || !acceptedTerms}
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
          disabled={loadingRole !== null || !acceptedTerms}
          className="text-left"
        >
          <Card className="h-full transition-colors hover:ring-primary/40">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destacado/30">
                <Store className="size-6 text-destacado-foreground" />
              </div>
              <div>
                <p className="font-heading text-lg">Quiero vender</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comercio, prestador de servicios o gimnasio
                </p>
              </div>
              <ul className="space-y-1 text-left text-xs text-muted-foreground">
                <li>• Sumá reseñas reales que generan confianza</li>
                <li>• Conseguí el sello de verificado</li>
                <li>• Mostrate primero con un plan destacado</li>
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

      <div className="space-y-1.5">
        <div className="flex items-start justify-center gap-2">
          <Checkbox
            id="acceptedTerms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => {
              setAcceptedTerms(checked === true)
              if (checked === true) setError(null)
            }}
            aria-invalid={!!error}
            className="mt-0.5"
          />
          <label htmlFor="acceptedTerms" className="text-sm text-foreground">
            Acepto los{' '}
            <Link href="/terminos" className="underline" target="_blank">
              Términos y Condiciones
            </Link>
          </label>
        </div>
        {!acceptedTerms && !error && (
          <p className="text-center text-xs text-muted-foreground">
            Tenés que aceptar los términos para poder elegir una opción.
          </p>
        )}
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </>
  )
}
