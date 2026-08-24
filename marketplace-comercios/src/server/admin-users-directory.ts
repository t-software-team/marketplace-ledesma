import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface UserDirectoryEntry {
  id: string
  role: UserRole | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  city: string | null
  created_at: string
  email: string | null
  last_sign_in_at: string | null
  is_banned: boolean
}

const PROFILES_LIMIT = 500

export async function getUsersDirectory(): Promise<UserDirectoryEntry[]> {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, avatar_url, phone, city, created_at')
    .order('created_at', { ascending: false })
    .limit(PROFILES_LIMIT)

  if (error) console.error('getUsersDirectory: fallo al traer profiles', error)

  const rows = profiles ?? []

  // Fetch auth users via el service-role client para email/last_sign_in_at.
  // auth.admin.listUsers no permite filtrar por lista de ids, así que se
  // pagina, pero acotado a lo que realmente hace falta para cubrir `rows`
  // (no siempre las 20 páginas x 200 = 4000 users de antes): corta apenas
  // ya se encontró un auth user por cada profile, o al llegar a un techo
  // duro de páginas si por lo que sea no matchean 1:1.
  const service = createServiceRoleClient()
  const authUsersById = new Map<
    string,
    { email: string | null; last_sign_in_at: string | null; is_banned: boolean }
  >()
  const perPage = 200
  const maxPages = Math.min(10, Math.max(1, Math.ceil(rows.length / perPage) + 1))

  for (let page = 1; page <= maxPages && authUsersById.size < rows.length; page++) {
    const { data: userPage, error: listUsersError } = await service.auth.admin.listUsers({ page, perPage })
    if (listUsersError) console.error('getUsersDirectory: fallo al listar auth users', { page, error: listUsersError })
    if (listUsersError || !userPage) break

    for (const authUser of userPage.users) {
      const bannedUntil = authUser.banned_until
      authUsersById.set(authUser.id, {
        email: authUser.email ?? null,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
        is_banned: !!bannedUntil && new Date(bannedUntil).getTime() > Date.now(),
      })
    }

    if (userPage.users.length < perPage) break
  }

  return rows
    .map((profile) => {
      const authUser = authUsersById.get(profile.id)
      return {
        ...profile,
        email: authUser?.email ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        is_banned: authUser?.is_banned ?? false,
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
