import {
  AlertTriangle,
  Flag,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getDashboardStats, getRecentContacts, getShopsGrowthSeries } from '@/lib/admin/dashboard-queries'
import { RevenueByPlanChart, ShopsGrowthChart } from './dashboard-charts'
import { LiveContactsFeed } from './live-contacts-feed'

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-6">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboardPage() {
  const [stats, shopsGrowth, recentContacts] = await Promise.all([
    getDashboardStats(),
    getShopsGrowthSeries(30),
    getRecentContacts(15),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-heading">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estado general del marketplace, actualizado en tiempo real.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-destacado p-6 shadow-lg shadow-primary/20 sm:p-8">
        <Sparkles
          className="absolute -top-4 -right-4 size-32 text-primary-foreground/10"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <TrendingUp className="size-4" aria-hidden />
              <p className="text-sm font-medium tracking-wide uppercase">Ingresos totales</p>
            </div>
            <p className="mt-2 font-mono text-4xl font-bold text-primary-foreground sm:text-5xl">
              {formatMoney(stats.totalRevenue)}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/70">
              Acumulado de suscripciones pagas (activas y vencidas)
            </p>
          </div>
          <div className="flex gap-4 text-primary-foreground/90">
            <div className="rounded-xl bg-primary-foreground/10 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-xs text-primary-foreground/70">Activas</p>
              <p className="font-mono text-lg font-semibold">{stats.activeSubscriptionsCount}</p>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-xs text-primary-foreground/70">Pendientes</p>
              <p className="font-mono text-lg font-semibold">{stats.pendingSubscriptionsCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Store} label="Comercios totales" value={stats.totalShops} />
        <StatCard icon={Store} label="Nuevos (30 días)" value={stats.newShops} />
        <StatCard icon={ShieldCheck} label="Verificados" value={stats.verifiedShops} />
        <StatCard icon={AlertTriangle} label="Pausados" value={stats.pausedShops} />
        <StatCard icon={Package} label="Productos activos" value={stats.activeProducts} />
        <StatCard icon={Flag} label="Reportes pendientes" value={stats.pendingReports} />
        <StatCard icon={MessageCircle} label="Sugerencias pendientes" value={stats.pendingSuggestions} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Comercios nuevos (últimos 30 días)
            </h2>
            <ShopsGrowthChart data={shopsGrowth} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Ingresos por plan</h2>
            <RevenueByPlanChart data={stats.revenueByPlan} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Contactos por WhatsApp recientes
          </h2>
          <LiveContactsFeed initialContacts={recentContacts} />
        </CardContent>
      </Card>
    </div>
  )
}
