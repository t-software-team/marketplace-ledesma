import Link from 'next/link'
import Image from 'next/image'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ChevronRight,
  Clock,
  Dumbbell,
  LogIn,
  Smartphone,
  UserPlus,
  Users,
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

function ProgressRing({
  value,
  max,
  size = 48,
  strokeWidth = 5,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? Math.min(value / max, 1) : 0
  const reached = progress >= 1

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={reached ? 'stroke-warning' : 'stroke-primary'}
        />
      </svg>
    </div>
  )
}

/** A card that links elsewhere. Chevron is a persistent affordance — hover
 * alone means nothing on the touch devices this app is built for. */
function LinkCard({
  href,
  alert,
  children,
}: {
  href: string
  alert?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl p-4 transition-colors ${
        alert
          ? 'border border-warning bg-warning/10 text-warning-foreground hover:bg-warning/15'
          : 'border border-border bg-card hover:border-primary'
      }`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden />
    </Link>
  )
}

export function GymResumen({ shopName, logoUrl, stats, memberLimit, recentCheckIns }: GymResumenProps) {
  const monthRevenue = stats.revenue_month_cash + stats.revenue_month_transfer
  const hasRisk = stats.expired_members > 0 || stats.expiring_soon > 0

  return (
    <div className="space-y-6 pb-8">
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
      </div>

      {/* Un solo lugar para las dos acciones más frecuentes, en todos los
          tamaños de pantalla — antes vivían duplicadas entre el header
          desktop y una grilla aparte solo para mobile. */}
      <div className="grid grid-cols-2 gap-2">
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

      {/* Hero: los dos números que el dueño busca primero, con más peso
          visual que el resto de la pantalla. */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <p className="text-xs text-muted-foreground">Socios activos</p>
            <p className="font-heading text-3xl">{stats.active_members}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-4 pt-5">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <p className="text-xs text-muted-foreground">Ingresos hoy</p>
            <p className="font-heading text-3xl">{stats.checkins_today}</p>
          </CardContent>
        </Card>
      </div>

      {/* Riesgo: agrupa lo que necesita acción, con el mismo tratamiento
          visual (fondo con tinte, no solo un borde) que ya usa el resto de
          la app para avisos de suscripción. */}
      {hasRisk && (
        <div className="grid gap-2 sm:grid-cols-2">
          {stats.expired_members > 0 && (
            <LinkCard href="/mi-tienda/socios" alert>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                <p className="text-sm">
                  <strong>{stats.expired_members}</strong>{' '}
                  {stats.expired_members === 1 ? 'socio vencido' : 'socios vencidos'}
                </p>
              </div>
            </LinkCard>
          )}
          {stats.expiring_soon > 0 && (
            <LinkCard href="/mi-tienda/vencimientos" alert>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0" aria-hidden />
                <p className="text-sm">
                  <strong>{stats.expiring_soon}</strong> {stats.expiring_soon === 1 ? 'vence' : 'vencen'} en
                  7 días
                </p>
              </div>
            </LinkCard>
          )}
        </div>
      )}

      {stats.members_without_phone > 0 && (
        <LinkCard href="/mi-tienda/socios" alert>
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0" aria-hidden />
            <p className="text-sm">
              <strong>{stats.members_without_phone}</strong>{' '}
              {stats.members_without_phone === 1
                ? 'socio no tiene celular cargado'
                : 'socios no tienen celular cargado'}{' '}
              y no pueden usar el autoingreso.
            </p>
          </div>
        </LinkCard>
      )}

      {memberLimit.max !== null && (
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <p className="text-xs text-muted-foreground">Cupo del plan</p>
            <div className="flex items-center gap-3">
              <p className={`font-heading text-lg ${memberLimit.reached ? 'text-warning-foreground' : ''}`}>
                {memberLimit.used}/{memberLimit.max}
              </p>
              <ProgressRing value={memberLimit.used} max={memberLimit.max} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingresos del mes: un total como número principal, efectivo y
          transferencia como desglose secundario dentro de la misma card. */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            <p className="font-heading text-2xl text-primary">{formatARS(monthRevenue)}</p>
          </div>
          <div className="flex gap-4 border-t border-border/50 pt-3 text-sm">
            <p className="text-muted-foreground">
              Efectivo <span className="font-medium text-foreground">{formatARS(stats.revenue_month_cash)}</span>
            </p>
            <p className="text-muted-foreground">
              Transferencia{' '}
              <span className="font-medium text-foreground">{formatARS(stats.revenue_month_transfer)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <LinkCard href="/mi-tienda/reportes">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-medium">Reportes</p>
            <p className="text-xs text-muted-foreground">
              Asistencia e ingresos por rango de fecha, con export CSV.
            </p>
          </div>
        </div>
      </LinkCard>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <p className="text-sm font-medium">Últimos ingresos</p>
          {recentCheckIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay ingresos registrados. Van a aparecer acá apenas un socio haga check-in.
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>

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
