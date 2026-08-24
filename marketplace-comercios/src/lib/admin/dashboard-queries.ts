import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_admin_dashboard_stats').single()
  if (error) throw error

  return {
    totalShops: data.total_shops ?? 0,
    newShops: data.new_shops ?? 0,
    verifiedShops: data.verified_shops ?? 0,
    pausedShops: data.paused_shops ?? 0,
    activeProducts: data.active_products ?? 0,
    pendingReports: data.pending_reports ?? 0,
    pendingSuggestions: data.pending_suggestions ?? 0,
    pendingVerificationsOver48h: data.pending_verifications_over_48h ?? 0,
    activeSubscriptionsCount: data.active_subscriptions_count ?? 0,
    pendingSubscriptionsCount: data.pending_subscriptions_count ?? 0,
    totalRevenue: data.total_revenue ?? 0,
    revenueByPlan: (data.revenue_by_plan ?? []) as { name: string; revenue: number }[],
  }
}

export async function getShopsGrowthSeries(days = 30) {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('shops')
    .select('created_at')
    .is('deleted_at', null)
    .gte('created_at', since.toISOString())

  if (error) console.error('getShopsGrowthSeries: fallo al traer shops', error)

  const counts = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const date = new Date(since)
    date.setDate(date.getDate() + i)
    counts.set(date.toISOString().slice(0, 10), 0)
  }

  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([date, count]) => ({
    date: new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(new Date(date)),
    comercios: count,
  }))
}

export async function getRecentContacts(limit = 15) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_contacts')
    .select('id, created_at, shops ( id, name ), products ( id, name )')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('getRecentContacts: fallo al traer shop_contacts', error)

  return data ?? []
}
