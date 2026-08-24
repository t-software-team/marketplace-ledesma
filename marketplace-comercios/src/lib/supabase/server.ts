import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// auth.getUser() pega contra el servidor de Auth de Supabase por red, no es
// una simple lectura de JWT local. React.cache() memoiza el resultado por
// request, así que layouts y pages que llaman a esto durante el mismo
// render (ej. mi-tienda/layout.tsx + mi-tienda/page.tsx, ambos vía
// getMyShop) comparten un solo round-trip en vez de uno cada uno.
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
