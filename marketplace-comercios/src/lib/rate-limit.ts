import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

async function resolveActor(userId: string | null): Promise<string> {
  if (userId) return `user:${userId}`

  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() ?? headersList.get('x-real-ip') ?? 'unknown'
  return `ip:${ip}`
}

/**
 * Returns true if the action is allowed, false if the caller hit the limit.
 * Actor resolution: logged-in user id, or IP address for anonymous callers.
 */
export async function checkRateLimit(
  action: string,
  maxCount: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const actor = await resolveActor(user?.id ?? null)

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_actor: actor,
    p_action: action,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('checkRateLimit: fallo al verificar límite', { action, error })
    return true
  }

  return Boolean(data)
}
