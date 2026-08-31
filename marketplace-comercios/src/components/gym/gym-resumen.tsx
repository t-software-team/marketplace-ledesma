import Link from 'next/link'
import Image from 'next/image'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Dumbbell,
  LogIn,
  Smartphone,
  TrendingUp,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  GYM_ACCESS_SOURCE_LABEL,
  type GymDashboardStats,
  type GymRecentCheckInRow,
} from '@/lib/gym/queries'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

interface GymResumenProps {
  shopName: string
  logoUrl?: string | null
  stats: GymDashboardStats
  memberLimit: { used: number; max: number | null; reached: boolean }
  recentCheckIns: GymRecentCheckInRow[]
}

export function GymResumen({ shopName, logoUrl, stats, memberLimit, recentCheckIns }: GymResumenProps) {
  const monthRevenue = stats.revenue_month_cash + stats.revenue_month_transfer

  const kpis = [
    { icon: LogIn, label: 'Ingresos hoy', value: stats.checkins_today },
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
    ...(memberLimit.max !== null
      ? [
          {
            icon: Users,
            label: 'Cupo del plan',
            value: `${memberLimit.used}/${memberLimit.max}`,
            highlight: memberLimit.reached,
          },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {logoUrl ? (
              <Image src={logoUrl} alt={shopName} fill className="object-cover" sizes="48px" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Dumbbell className="size-5" aria-hidden />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-heading leading-tight">{shopName}</h1>
            <p className="text-sm text-muted-foreground">Panel de tu gimnasio</p>
          </div>
        </div>
        <Button
          render={<Link href="/mi-tienda/socios/nuevo" />}
          nativeButton={false}
          className="hidden sm:inline-flex"
        >
          Nuevo socio
        </Button>
      </div>

      {/* Accesos rápidos de mostrador — solo mobile */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <Button
          render={<Link href="/mi-tienda/ingresos" />}
          nativeButton={false}
          className="h-12 gap-1.5"
        >
          <LogIn className="size-4" aria-hidden />
          Registrar ingreso
        </Button>
        <Button
          render={<Link href="/mi-tienda/socios/nuevo" />}
          nativeButton={false}
          variant="outline"
          className="h-12 gap-1.5"
        >
          <UserPlus className="size-4" aria-hidden />
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

      {stats.members_without_phone > 0 && (
        <Link href="/mi-tienda/socios" className="block">
          <Card className="border-warning transition-colors hover:border-primary">
            <CardContent className="flex flex-wrap items-center gap-3 pt-6">
              <Smartphone className="size-5 shrink-0 text-warning-foreground" aria-hidden />
              <p className="text-sm">
                <strong>{stats.members_without_phone}</strong>{' '}
                {stats.members_without_phone === 1
                  ? 'socio no tiene celular cargado'
                  : 'socios no tienen celular cargado'}{' '}
                y no pueden usar el autoingreso.
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

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

      <Link href="/mi-tienda/reportes" className="block">
        <Card className="transition-colors hover:border-primary">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm font-medium">Reportes</p>
                <p className="text-xs text-muted-foreground">
                  Asistencia e ingresos por rango de fecha, con export CSV.
                </p>
              </div>
            </div>
            <TrendingUp className="size-4 text-primary" aria-hidden />
          </CardContent>
        </Card>
      </Link>

      {recentCheckIns.length > 0 && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="text-sm font-medium">Últimos ingresos</p>
            <div className="space-y-1">
              {recentCheckIns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm last:border-0"
                >
                  <span className="truncate">{c.member_name ?? 'Socio'}</span>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span>{GYM_ACCESS_SOURCE_LABEL[c.source].toLowerCase()}</span>
                    <span className="font-mono">{formatTime(c.checked_in_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
