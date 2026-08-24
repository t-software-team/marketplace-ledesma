'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const REFRESH_EVENTS = new Set(['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'])
// Cruzar el borde de identidad (login/logout) invalida cualquier dato client-side
// cacheado (header, favoritos, etc.); un refresh de token no cambia quién sos.
const IDENTITY_EVENTS = new Set(['SIGNED_IN', 'SIGNED_OUT'])

export function AuthListener() {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (IDENTITY_EVENTS.has(event)) {
        queryClient.invalidateQueries()
      }
      if (REFRESH_EVENTS.has(event)) {
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, queryClient])

  return null
}
