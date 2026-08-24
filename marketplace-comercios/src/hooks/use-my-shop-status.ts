import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface MyShopReview {
  id: string
  rating: number
  comment: string | null
}

export interface MyShopStatus {
  isLoggedIn: boolean
  isFollowing: boolean
  myReview: MyShopReview | null
}

const LOGGED_OUT: MyShopStatus = {
  isLoggedIn: false,
  isFollowing: false,
  myReview: null,
}

/**
 * Resuelve en el cliente el estado del usuario respecto de una tienda (si la
 * sigue y su reseña), para que `/tienda/[slug]` no lea la sesión en el servidor
 * y pueda servirse estática/ISR. Reemplaza a getMyShopFollow + getMyShopReview.
 * Los botones/diálogos que lo consumen muestran un estado neutro mientras carga.
 */
export function useMyShopStatus(shopId: string) {
  return useQuery<MyShopStatus>({
    queryKey: ['my-shop-status', shopId],
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
        console.error('useMyShopStatus: fallo al traer el usuario', { shopId, error: userError })
      }
      if (!user) return LOGGED_OUT

      const [followRes, reviewRes] = await Promise.all([
        supabase
          .from('shop_follows')
          .select('id')
          .eq('shop_id', shopId)
          .eq('client_id', user.id)
          .maybeSingle(),
        supabase
          .from('shop_reviews')
          .select('id, rating, comment')
          .eq('shop_id', shopId)
          .eq('client_id', user.id)
          .maybeSingle(),
      ])

      if (followRes.error) {
        console.error('useMyShopStatus: fallo al verificar el seguimiento', {
          shopId,
          error: followRes.error,
        })
      }
      if (reviewRes.error) {
        console.error('useMyShopStatus: fallo al traer la reseña del usuario', {
          shopId,
          error: reviewRes.error,
        })
      }

      return {
        isLoggedIn: true,
        isFollowing: Boolean(followRes.data),
        myReview: reviewRes.data ?? null,
      }
    },
  })
}
