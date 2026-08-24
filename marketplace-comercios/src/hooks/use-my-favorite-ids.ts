import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Resuelve en el cliente los ids de productos favoritos del usuario en una sola
 * query, para que el feed (`/`) no tenga que leer la sesión en el servidor y
 * pueda servirse estático/ISR. Devuelve `[]` si no hay sesión. Fail-open: ante
 * un error loguea y devuelve `[]` (corazones vacíos), nunca bloquea el feed.
 */
export function useMyFavoriteIds() {
  return useQuery<string[]>({
    queryKey: ['my-favorite-ids'],
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
        console.error('useMyFavoriteIds: fallo al traer el usuario', { error: userError })
      }
      if (!user) return []

      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('client_id', user.id)
      if (error) {
        console.error('useMyFavoriteIds: fallo al traer los favoritos', { error })
        return []
      }

      return (data ?? []).map((favorite) => favorite.product_id)
    },
  })
}
