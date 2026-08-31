import { createClient, getAuthUser } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import {
  addDaysToDate,
  argentinaDateString,
  argentinaStartOfDayUTC,
  argentinaStartOfTodayUTC,
  argentinaToday,
  daysFromArgentinaToday,
} from '@/lib/timezone'

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

export interface PublicGymPlan {
  id: string
  name: string
  kind: GymPlanKind
  duration_days: number
  price: number
}

/**
 * Active plans for a gym's public page. Uses the anon client (no session) and
 * relies on the public-read RLS policy on active plans.
 */
export async function getPublicGymPlans(shopId: string): Promise<PublicGymPlan[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('gym_plans')
    .select('id, name, kind, duration_days, price')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('duration_days', { ascending: true })
    .order('price', { ascending: true })
    .limit(20)

  if (error) {
    console.error('getPublicGymPlans: fallo al traer planes públicos', { shopId, error })
    return []
  }
  return (data as PublicGymPlan[]) ?? []
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
    // Match by name or document. Strip PostgREST-or metacharacters so the
    // filter can't be broken by commas/parens in the query.
    const q = options.search.replace(/[%,()]/g, ' ').trim()
    query = query.or(`full_name.ilike.%${q}%,document.ilike.%${q}%`)
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

  const today = argentinaToday()

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

export interface GymMembershipHistoryRow {
  id: string
  plan_name: string | null
  start_date: string
  expires_at: string
  price: number
  created_at: string
}

export interface GymCheckInRow {
  id: string
  member_id: string | null
  checked_in_at: string
  member_name?: string | null
}

export type GymAccessOutcome = 'allowed' | 'denied_expired' | 'denied_not_found'
export type GymAccessSource = 'desk' | 'self' | 'self_offline'

export interface GymAccessLogRow {
  id: string
  checked_in_at: string
  outcome: GymAccessOutcome
  source: GymAccessSource
  member_name: string | null
  /** Digits typed at the self check-in when no member matched. */
  attempted_ref: string | null
}

export interface GymMemberDetail extends GymMemberWithStatus {
  memberships: GymMembershipHistoryRow[]
  payments: GymPaymentRow[]
  check_ins: GymCheckInRow[]
}

export async function getGymMember(
  shopId: string,
  memberId: string
): Promise<GymMemberDetail | null> {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('gym_members')
    .select('id, shop_id, full_name, phone, email, document, is_archived, notes, created_at')
    .eq('shop_id', shopId)
    .eq('id', memberId)
    .maybeSingle()

  if (error || !member) {
    if (error) console.error('getGymMember: fallo al traer socio', { memberId, error })
    return null
  }

  const [membershipsRes, paymentsRes, checkInsRes] = await Promise.all([
    supabase
      .from('gym_memberships')
      .select('id, start_date, expires_at, price, created_at, gym_plans(name)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('gym_payments')
      .select('id, amount, method, status, paid_at, created_at, gym_memberships!inner(member_id)')
      .eq('shop_id', shopId)
      .eq('gym_memberships.member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('gym_check_ins')
      .select('id, member_id, checked_in_at')
      .eq('member_id', memberId)
      .order('checked_in_at', { ascending: false })
      .limit(50),
  ])

  const memberships: GymMembershipHistoryRow[] = (membershipsRes.data ?? []).map((row) => {
    const plan = row.gym_plans as { name: string } | null
    return {
      id: row.id,
      plan_name: plan?.name ?? null,
      start_date: row.start_date,
      expires_at: row.expires_at,
      price: row.price,
      created_at: row.created_at,
    }
  })

  const today = argentinaToday()
  const latestExpiry = memberships.reduce<string | null>(
    (latest, m) => (latest === null || m.expires_at > latest ? m.expires_at : latest),
    null
  )
  const status: GymMemberStatus = member.is_archived
    ? 'archived'
    : latestExpiry && latestExpiry >= today
      ? 'active'
      : 'expired'

  return {
    ...member,
    expires_at: latestExpiry,
    status,
    memberships,
    payments: (paymentsRes.data ?? []).map((row) => ({
      id: row.id,
      amount: row.amount,
      method: row.method as GymPaymentMethod,
      status: row.status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      member_name: member.full_name,
    })),
    check_ins: (checkInsRes.data ?? []).map((row) => ({
      id: row.id,
      member_id: row.member_id,
      checked_in_at: row.checked_in_at,
    })),
  }
}

export interface GymMemberSearchResult {
  id: string
  full_name: string
  document: string | null
  phone: string | null
  status: GymMemberStatus
  expires_at: string | null
}

export interface ExpiringMember {
  id: string
  full_name: string
  phone: string | null
  expires_at: string
  days_left: number
}

/** Members whose latest membership lapses within `withinDays` (and hasn't yet). */
export async function getExpiringMembers(
  shopId: string,
  withinDays = 7
): Promise<ExpiringMember[]> {
  const members = await getGymMembers(shopId, { status: 'active', limit: 500 })

  const result: ExpiringMember[] = []
  for (const m of members) {
    if (!m.expires_at) continue
    const daysLeft = daysFromArgentinaToday(m.expires_at)
    if (daysLeft >= 0 && daysLeft <= withinDays) {
      result.push({
        id: m.id,
        full_name: m.full_name,
        phone: m.phone,
        expires_at: m.expires_at,
        days_left: daysLeft,
      })
    }
  }
  return result.sort((a, b) => a.days_left - b.days_left)
}

export type GymAttendancePoint = {
  date: string
  ingresos: number
}

/** Ingresos (check-ins) por día de los últimos `days`, agrupados en hora AR. */
export async function getGymCheckInsSeries(
  shopId: string,
  days = 14
): Promise<GymAttendancePoint[]> {
  const supabase = await createClient()
  const since = argentinaStartOfTodayUTC()
  since.setUTCDate(since.getUTCDate() - (days - 1))

  const { data, error } = await supabase
    .from('gym_check_ins')
    .select('checked_in_at')
    .eq('shop_id', shopId)
    .gte('checked_in_at', since.toISOString())

  if (error) {
    console.error('getGymCheckInsSeries: fallo al traer asistencia', { shopId, days, error })
    return []
  }

  const counts = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    counts.set(addDaysToDate(argentinaToday(), i - (days - 1)), 0)
  }
  for (const row of data ?? []) {
    const day = argentinaDateString(new Date(row.checked_in_at))
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([date, ingresos]) => {
    const [, mm, dd] = date.split('-')
    return { date: `${dd}/${mm}`, ingresos }
  })
}

/** Widest range a report can span — bounds the check-ins/payments scan below. */
export const GYM_REPORT_MAX_DAYS = 92

export interface GymReportRow {
  date: string
  allowed: number
  denied_expired: number
  denied_not_found: number
}

export interface GymReportData {
  daily: GymReportRow[]
  totals: {
    allowed: number
    denied_expired: number
    denied_not_found: number
    by_source: { desk: number; self: number; self_offline: number }
    revenue_cash: number
    revenue_transfer: number
    revenue_mercadopago: number
  }
}

/**
 * Access + revenue report for an arbitrary date range (capped at
 * GYM_REPORT_MAX_DAYS). Aggregated in JS from raw rows — same approach as
 * getGymCheckInsSeries — which is fine at the bounded range this caps to, but
 * would need a SQL aggregate (RPC) if the range cap ever grows much further.
 */
export async function getGymReport(shopId: string, from: string, to: string): Promise<GymReportData> {
  const supabase = await createClient()
  const rangeStart = argentinaStartOfDayUTC(from).toISOString()
  const rangeEnd = argentinaStartOfDayUTC(addDaysToDate(to, 1)).toISOString()

  const [checkIns, payments] = await Promise.all([
    supabase
      .from('gym_check_ins')
      .select('checked_in_at, outcome, source')
      .eq('shop_id', shopId)
      .gte('checked_in_at', rangeStart)
      .lt('checked_in_at', rangeEnd)
      .limit(20000),
    supabase
      .from('gym_payments')
      .select('amount, method, paid_at')
      .eq('shop_id', shopId)
      .eq('status', 'paid')
      .gte('paid_at', rangeStart)
      .lt('paid_at', rangeEnd)
      .limit(20000),
  ])

  if (checkIns.error) {
    console.error('getGymReport: fallo al traer ingresos', { shopId, from, to, error: checkIns.error })
  }
  if (payments.error) {
    console.error('getGymReport: fallo al traer pagos', { shopId, from, to, error: payments.error })
  }

  const byDay = new Map<string, GymReportRow>()
  for (let d = from; d <= to; d = addDaysToDate(d, 1)) {
    byDay.set(d, { date: d, allowed: 0, denied_expired: 0, denied_not_found: 0 })
  }

  const bySource = { desk: 0, self: 0, self_offline: 0 }
  let allowed = 0
  let deniedExpired = 0
  let deniedNotFound = 0

  for (const row of checkIns.data ?? []) {
    const day = argentinaDateString(new Date(row.checked_in_at))
    const bucket = byDay.get(day)
    if (row.outcome === 'allowed') {
      allowed++
      if (bucket) bucket.allowed++
      if (row.source === 'desk' || row.source === 'self' || row.source === 'self_offline') {
        bySource[row.source]++
      }
    } else if (row.outcome === 'denied_expired') {
      deniedExpired++
      if (bucket) bucket.denied_expired++
    } else if (row.outcome === 'denied_not_found') {
      deniedNotFound++
      if (bucket) bucket.denied_not_found++
    }
  }

  let revenueCash = 0
  let revenueTransfer = 0
  let revenueMercadopago = 0
  for (const row of payments.data ?? []) {
    if (row.method === 'cash') revenueCash += row.amount
    else if (row.method === 'transfer') revenueTransfer += row.amount
    else if (row.method === 'mercadopago') revenueMercadopago += row.amount
  }

  return {
    daily: Array.from(byDay.values()),
    totals: {
      allowed,
      denied_expired: deniedExpired,
      denied_not_found: deniedNotFound,
      by_source: bySource,
      revenue_cash: revenueCash,
      revenue_transfer: revenueTransfer,
      revenue_mercadopago: revenueMercadopago,
    },
  }
}

export async function getTodayCheckIns(shopId: string, limit = 100): Promise<GymCheckInRow[]> {
  const supabase = await createClient()
  const startOfDay = argentinaStartOfTodayUTC()

  const { data, error } = await supabase
    .from('gym_check_ins')
    .select('id, member_id, checked_in_at, gym_members(full_name)')
    .eq('shop_id', shopId)
    .eq('outcome', 'allowed')
    .gte('checked_in_at', startOfDay.toISOString())
    .order('checked_in_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getTodayCheckIns: fallo al traer ingresos', { shopId, error })
    return []
  }

  return (data ?? []).map((row) => {
    const member = row.gym_members as { full_name: string } | null
    return {
      id: row.id,
      member_id: row.member_id,
      checked_in_at: row.checked_in_at,
      member_name: member?.full_name ?? null,
    }
  })
}

/**
 * Full access log for today — allowed entries plus denied attempts (expired
 * membership, unknown member) — for the owner's audit view.
 */
export async function getTodayAccessLog(shopId: string, limit = 200): Promise<GymAccessLogRow[]> {
  const supabase = await createClient()
  const startOfDay = argentinaStartOfTodayUTC()

  const { data, error } = await supabase
    .from('gym_check_ins')
    .select('id, checked_in_at, outcome, source, attempted_ref, gym_members(full_name)')
    .eq('shop_id', shopId)
    .gte('checked_in_at', startOfDay.toISOString())
    .order('checked_in_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getTodayAccessLog: fallo al traer el log de accesos', { shopId, error })
    return []
  }

  return (data ?? []).map((row) => {
    const member = row.gym_members as { full_name: string } | null
    return {
      id: row.id,
      checked_in_at: row.checked_in_at,
      outcome: row.outcome as GymAccessOutcome,
      source: row.source as GymAccessSource,
      member_name: member?.full_name ?? null,
      attempted_ref: row.attempted_ref,
    }
  })
}

/** Same shape as getTodayAccessLog, for an arbitrary date range (report export). */
export async function getGymAccessLogForRange(
  shopId: string,
  from: string,
  to: string
): Promise<GymAccessLogRow[]> {
  const supabase = await createClient()
  const rangeStart = argentinaStartOfDayUTC(from).toISOString()
  const rangeEnd = argentinaStartOfDayUTC(addDaysToDate(to, 1)).toISOString()

  const { data, error } = await supabase
    .from('gym_check_ins')
    .select('id, checked_in_at, outcome, source, attempted_ref, gym_members(full_name)')
    .eq('shop_id', shopId)
    .gte('checked_in_at', rangeStart)
    .lt('checked_in_at', rangeEnd)
    .order('checked_in_at', { ascending: false })
    .limit(20000)

  if (error) {
    console.error('getGymAccessLogForRange: fallo al traer el log de accesos', { shopId, from, to, error })
    return []
  }

  return (data ?? []).map((row) => {
    const member = row.gym_members as { full_name: string } | null
    return {
      id: row.id,
      checked_in_at: row.checked_in_at,
      outcome: row.outcome as GymAccessOutcome,
      source: row.source as GymAccessSource,
      member_name: member?.full_name ?? null,
      attempted_ref: row.attempted_ref,
    }
  })
}
