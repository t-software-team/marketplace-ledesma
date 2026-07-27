'use client'

import { ShoppingBag, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null)
  const supabase = createClient()

  async function selectRole(role: UserRole) {
    setError(null)
    setLoadingRole(role)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)

    if (updateError) {
      setError('No pudimos guardar tu elección. Intentá de nuevo.')
      setLoadingRole(null)
      return
    }

    if (role === 'shop_admin') {
      router.push('/mi-tienda')
    } else {
      router.push('/')
    }
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-12">
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
              <Button disabled={loadingRole === 'client'} variant="outline" className="mt-2">
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
              <Button disabled={loadingRole === 'shop_admin'} className="mt-2">
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
