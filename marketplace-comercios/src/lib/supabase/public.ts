import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Anon client with no cookie/session access — safe to use inside
 * `unstable_cache`, which forbids reading dynamic APIs (cookies/headers).
 * Only ever query public, RLS-safe data with this client.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
