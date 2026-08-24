import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { NotificationItem } from '@/components/shared/notification-bell'

export interface HeaderAuth {
  user: { email: string } | null
  profileRole: string | null
  profileFullName: string | null
  profileAvatarUrl: string | null
  notifications: NotificationItem[]
  unreadCount: number
}

export const HEADER_AUTH_QUERY_KEY = ['header-auth'] as const

const LOGGED_OUT: HeaderAuth = {
  user: null,
  profileRole: null,
  profileFullName: null,
  profileAvatarUrl: null,
  notifications: [],
  unreadCount: 0,
}

/**
 * Resuelve sesión + perfil + notificaciones del header en el cliente, para que
 * el layout público (`(public)/layout.tsx`) deje de leer cookies por request y
 * las páginas que envuelve puedan servirse estáticas/ISR. Espeja la query de
 * `getMyClientNotifications` server-side. Mientras `isLoading`, el header pinta
 * un skeleton neutro en vez de saltar de "deslogueado" a "logueado".
 */
export function useHeaderAuth() {
  return useQuery<HeaderAuth>({
    queryKey: [...HEADER_AUTH_QUERY_KEY],
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
        console.error('useHeaderAuth: fallo al traer el usuario', { error: userError })
      }
      if (!user) return LOGGED_OUT

      const [profileRes, notificationsRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('role, full_name, avatar_url').eq('id', user.id).single(),
        supabase
          .from('client_notifications')
          .select('id, type, reference_id, is_read, created_at')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('client_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('is_read', false),
      ])

      if (profileRes.error) {
        console.error('useHeaderAuth: fallo al traer el perfil', { error: profileRes.error })
      }
      if (notificationsRes.error) {
        console.error('useHeaderAuth: fallo al traer las notificaciones', {
          error: notificationsRes.error,
        })
      }

      return {
        user: { email: user.email ?? '' },
        profileRole: profileRes.data?.role ?? null,
        profileFullName: profileRes.data?.full_name ?? null,
        profileAvatarUrl: profileRes.data?.avatar_url ?? null,
        notifications: notificationsRes.data ?? [],
        unreadCount: unreadRes.count ?? 0,
      }
    },
  })
}
