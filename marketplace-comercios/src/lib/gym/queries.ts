import { createClient, getAuthUser } from '@/lib/supabase/server'

export type GymPlanKind = 'daily' | 'multi_day' | 'monthly' | 'custom'
export type GymPaymentMethod = 'cash' | 'transfer' | 'mercadopago'
export type GymMemberStatus = 'active' | 'expired' | 'archived'

export interface GymPlan {
  id: string
  shop_id: string
  name: string
  kind: GymPlanKind
  duration_days: number
  price: number
  is_active: boolean
  created_at: string
}

export interface GymMemberWithStatus {
  id: string
  shop_id: string
  full_name: string
  phone: string | null
  email: string | null
  document: string | null
  is_archived: boolean
  notes: string | null
  created_at: string
  /** Latest membership expiry, null if the member never bought a plan. */
  expires_at: string | null
  status: GymMemberStatus
}

export interface GymPaymentRow {
  id: string
  amount: number
  method: GymPaymentMethod
  status: string
  paid_at: string | null
  created_at: string
  member_name: string | null
}

export interface GymDashboardStats {
  active_members: number
  expired_members: number
  archived_members: number
  new_members_month: number
  expiring_soon: number
  revenue_month_cash: number
  revenue_month_transfer: number
}

/** Resolves the current user's shop id, or null if they have none. */
export async function getMyShopId(): Promise<string | null> {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) return null

  const { data } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return data?.id ?? null
}

export async function getGymPlans(shopId: string): Promise<GymPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gym_plans')
    .select('id, shop_id, name, kind, duration_days, price, is_active, created_at')
    .eq('shop_id', shopId)
    .order('is_active', { ascending: false })
    .order('price', { ascending: true })
    .limit(100)

  if (error) {
    console.error('getGymPlans: fallo al traer planes', { shopId, error })
    return []
  }
  return (data as GymPlan[]) ?? []
}

interface GetGymMembersOptions {
  search?: string
  /** 'active' | 'expired' | 'archived' | undefined (todos los no archivados) */
  status?: GymMemberStatus
  /** Hard cap on rows fetched. Members lists grow unbounded otherwise. */
  limit?: number
}

const GYM_MEMBERS_DEFAULT_LIMIT = 200

export async function getGymMembers(
  shopId: string,
  options: GetGymMembersOptions = {}
): Promise<GymMemberWithStatus[]> {
  const supabase = await createClient()

  let query = supabase
    .from('gym_members')
    .select(
      'id, shop_id, full_name, phone, email, document, is_archived, notes, created_at, gym_memberships(expires_at)'
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? GYM_MEMBERS_DEFAULT_LIMIT)

  if (options.search) {
    query = query.ilike('full_name', `%${options.search}%`)
  }
  if (options.status === 'archived') {
    query = query.eq('is_archived', true)
  } else {
    query = query.eq('is_archived', false)
  }

  const { data, error } = await query
  if (error) {
    console.error('getGymMembers: fallo al traer socios', { shopId, error })
    return []
  }

  const today = new Date().toISOString().slice(0, 10)

  const members: GymMemberWithStatus[] = (data ?? []).map((row) => {
    const periods = (row.gym_memberships ?? []) as { expires_at: string }[]
    const expiresAt = periods.reduce<string | null>(
      (latest, p) => (latest === null || p.expires_at > latest ? p.expires_at : latest),
      null
    )
    const status: GymMemberStatus = row.is_archived
      ? 'archived'
      : expiresAt && expiresAt >= today
        ? 'active'
        : 'expired'

    return {
      id: row.id,
      shop_id: row.shop_id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      document: row.document,
      is_archived: row.is_archived,
      notes: row.notes,
      created_at: row.created_at,
      expires_at: expiresAt,
      status,
    }
  })

  // 'active' / 'expired' filtering is derived, so it runs after the query.
  if (options.status === 'active' || options.status === 'expired') {
    return members.filter((m) => m.status === options.status)
  }
  return members
}

export async function getGymDashboardStats(shopId: string): Promise<GymDashboardStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_gym_dashboard_stats', { p_shop_id: shopId })

  if (error || !data) {
    console.error('getGymDashboardStats: fallo al traer métricas', { shopId, error })
    return {
      active_members: 0,
      expired_members: 0,
      archived_members: 0,
      new_members_month: 0,
      expiring_soon: 0,
      revenue_month_cash: 0,
      revenue_month_transfer: 0,
    }
  }

  return data as unknown as GymDashboardStats
}

export async function getGymPayments(shopId: string, limit = 50): Promise<GymPaymentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gym_payments')
    .select(
      'id, amount, method, status, paid_at, created_at, gym_memberships(gym_members(full_name))'
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getGymPayments: fallo al traer pagos', { shopId, error })
    return []
  }

  return (data ?? []).map((row) => {
    const membership = row.gym_memberships as { gym_members?: { full_name: string } | null } | null
    return {
      id: row.id,
      amount: row.amount,
      method: row.method as GymPaymentMethod,
      status: row.status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      member_name: membership?.gym_members?.full_name ?? null,
    }
  })
}
