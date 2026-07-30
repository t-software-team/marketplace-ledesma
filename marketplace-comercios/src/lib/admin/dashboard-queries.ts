import { createClient } from '@/lib/supabase/server'

const REVENUE_STATUSES = ['active', 'expired'] as const

export async function getDashboardStats() {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalShops },
    { count: newShops },
    { count: verifiedShops },
    { count: pausedShops },
    { count: activeProducts },
    { count: pendingReports },
    { count: pendingSuggestions },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from('shops').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('shops')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('shops')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .is('deleted_at', null),
    supabase
      .from('shops')
      .select('id', { count: 'exact', head: true })
      .eq('is_paused', true)
      .is('deleted_at', null),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('shop_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('category_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('subscriptions')
      .select('id, status, created_at, subscription_plans ( name, price )'),
  ])

  const allSubscriptions = subscriptions ?? []
  const activeSubscriptions = allSubscriptions.filter((sub) => sub.status === 'active')
  const pendingSubscriptions = allSubscriptions.filter((sub) => sub.status === 'pending')

  const totalRevenue = allSubscriptions
    .filter((sub) => REVENUE_STATUSES.includes(sub.status as (typeof REVENUE_STATUSES)[number]))
    .reduce((sum, sub) => sum + (sub.subscription_plans?.price ?? 0), 0)

  const revenueByPlan = new Map<string, number>()
  for (const sub of allSubscriptions) {
    if (!REVENUE_STATUSES.includes(sub.status as (typeof REVENUE_STATUSES)[number])) continue
    const planName = sub.subscription_plans?.name ?? 'Sin plan'
    const price = sub.subscription_plans?.price ?? 0
    revenueByPlan.set(planName, (revenueByPlan.get(planName) ?? 0) + price)
  }

  return {
    totalShops: totalShops ?? 0,
    newShops: newShops ?? 0,
    verifiedShops: verifiedShops ?? 0,
    pausedShops: pausedShops ?? 0,
    activeProducts: activeProducts ?? 0,
    pendingReports: pendingReports ?? 0,
    pendingSuggestions: pendingSuggestions ?? 0,
    activeSubscriptionsCount: activeSubscriptions.length,
    pendingSubscriptionsCount: pendingSubscriptions.length,
    totalRevenue,
    revenueByPlan: Array.from(revenueByPlan.entries()).map(([name, revenue]) => ({ name, revenue })),
  }
}

export async function getShopsGrowthSeries(days = 30) {
  const supabase = await createClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('shops')
    .select('created_at')
    .is('deleted_at', null)
    .gte('created_at', since.toISOString())

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

  const { data } = await supabase
    .from('shop_contacts')
    .select('id, created_at, shops ( id, name ), products ( id, name )')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
