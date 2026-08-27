import Link from 'next/link'
import { AlertTriangle, CalendarClock, TrendingUp, UserPlus, Users, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { GymDashboardStats } from '@/lib/gym/queries'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

interface GymResumenProps {
  shopName: string
  stats: GymDashboardStats
}

export function GymResumen({ shopName, stats }: GymResumenProps) {
  const monthRevenue = stats.revenue_month_cash + stats.revenue_month_transfer

  const kpis = [
    { icon: Users, label: 'Socios activos', value: stats.active_members },
    {
      icon: CalendarClock,
      label: 'Vencen en 7 días',
      value: stats.expiring_soon,
      highlight: stats.expiring_soon > 0,
      href: '/mi-tienda/vencimientos',
    },
    { icon: AlertTriangle, label: 'Vencidos', value: stats.expired_members },
    { icon: UserPlus, label: 'Altas del mes', value: stats.new_members_month },
    { icon: UserX, label: 'Bajas', value: stats.archived_members },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-heading">{shopName}</h1>
          <p className="text-sm text-muted-foreground">Panel de tu gimnasio</p>
        </div>
        <Button render={<Link href="/mi-tienda/socios/nuevo" />} nativeButton={false}>
          Nuevo socio
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(({ icon: Icon, label, value, highlight, href }) => {
          const card = (
            <Card
              className={`h-full ${highlight ? 'border-warning' : ''} ${href ? 'transition-colors hover:border-primary' : ''}`}
            >
              <CardContent className="space-y-1 px-3 pt-4 sm:px-4 sm:pt-5">
                <Icon
                  className={`size-4 ${highlight ? 'text-warning-foreground' : 'text-muted-foreground'}`}
                  aria-hidden
                />
                <p className="truncate text-xs text-muted-foreground">{label}</p>
                <p className="font-heading text-xl sm:text-2xl">{value}</p>
              </CardContent>
            </Card>
          )
          return href ? (
            <Link key={label} href={href} className="block">
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Efectivo (mes)</p>
            <p className="font-heading text-lg">{formatARS(stats.revenue_month_cash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <p className="text-xs text-muted-foreground">Transferencia (mes)</p>
            <p className="font-heading text-lg">{formatARS(stats.revenue_month_transfer)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
            <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            <p className="font-heading text-lg text-primary">{formatARS(monthRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/mi-tienda/socios" />} nativeButton={false} variant="outline">
          Ver socios
        </Button>
        <Button render={<Link href="/mi-tienda/planes" />} nativeButton={false} variant="outline">
          Planes
        </Button>
        <Button render={<Link href="/mi-tienda/caja" />} nativeButton={false} variant="outline">
          Caja
        </Button>
      </div>
    </div>
  )
}
