import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface FavoriteStatus {
  isLoggedIn: boolean
  isFavorite: boolean
}

/**
 * Resuelve login + estado de favorito de un producto en el cliente, para que
 * la página que contiene el botón pueda renderizarse sin depender de la
 * sesión en el servidor. `enabled` permite desactivarlo cuando el estado ya
 * viene provisto por el servidor (ej. cards del feed).
 */
export function useFavoriteStatus(productId: string, enabled = true) {
  return useQuery<FavoriteStatus>({
    queryKey: ['favorite-status', productId],
    enabled,
    queryFn: async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      // Sin sesión, getUser() devuelve AuthSessionMissingError: es el estado
      // normal de un visitante deslogueado, no un fallo. Solo logueamos errores
      // reales (red, etc.).
      if (userError && userError.name !== 'AuthSessionMissingError') {
        console.error('useFavoriteStatus: fallo al traer el usuario', { productId, error: userError })
      }
      if (!user) return { isLoggedIn: false, isFavorite: false }

      const { data: favorite, error: favoriteError } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('client_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()
      if (favoriteError) {
        console.error('useFavoriteStatus: fallo al traer el favorito', { productId, error: favoriteError })
      }

      return { isLoggedIn: true, isFavorite: Boolean(favorite) }
    },
  })
}
