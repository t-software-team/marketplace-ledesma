'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Eye,
  History,
  MessageCircle,
  PawPrint,
  Percent,
  Stethoscope,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ShopLinkCard } from '@/components/shop/shop-link-card'
import { ShopProfileHeader } from '@/components/shop/shop-profile-header'
import { cn } from '@/lib/utils'
import type { AppointmentRow } from '@/lib/turnos/queries'
import type { ShopReminderAlerts } from '@/lib/patients/alerts'
import type { ActivityFeedItem, SpeciesBreakdownItem, TrendValue } from '@/lib/patients/dashboard-queries'
import { QuickLogCard, type QuickLogPatient } from './quick-log-card'

const SPECIES_LABELS: Record<string, string> = {
  perro: 'perros',
  gato: 'gatos',
  otro: 'otros',
}

function formatSpeciesBreakdown(breakdown: SpeciesBreakdownItem[]): string {
  return breakdown
    .map(({ species, count }) => `${count} ${SPECIES_LABELS[species] ?? species}`)
    .join(' · ')
}

/** "+3 vs. semana pasada" / "-1 vs. semana pasada" / "= vs. semana pasada". */
function TrendDelta({
  trend,
  label,
  format = (n) => `${n}`,
}: {
  trend: TrendValue
  label: string
  format?: (value: number) => string
}) {
  const diff = trend.current - trend.previous
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '±'
  return (
    <span className={cn('text-xs', diff > 0 ? 'text-success-foreground' : 'text-muted-foreground')}>
      {sign}
      {format(Math.abs(diff))} {label}
    </span>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export interface VetResumenProps {
  shopName: string
  logoUrl?: string | null
  coverUrl?: string | null
  shopSlug: string
  shopUrl: string
  isVerified: boolean
  verificationStatus: string
  isPaused: boolean
  pausedReason?: string | null
  upcomingAppointments: AppointmentRow[]
  treatmentAlerts: ShopReminderAlerts
  alertedPatients: { id: string; name: string; overdue: number; upcoming: number; nextDueAt: string | null }[]
  patients: QuickLogPatient[]
  patientsCount: number
  speciesBreakdown: SpeciesBreakdownItem[]
  weeklyCompletedAppointments: TrendValue
  monthlyTreatmentCount: TrendValue
  weeklyNewPatients: TrendValue
  weeklyRevenue: TrendValue
  activityFeed: ActivityFeedItem[]
  profileViews: number
  whatsappClicks: number
  followerCount: number
}

/** A card that links elsewhere. Chevron is a persistent affordance — hover
 * alone means nothing on the touch devices this app is built for. Mirrors
 * gym-resumen's LinkCard verbatim. */
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

export function VetResumen({
  shopName,
  logoUrl,
  coverUrl,
  shopSlug,
  shopUrl,
  isVerified,
  verificationStatus,
  isPaused,
  pausedReason,
  upcomingAppointments,
  treatmentAlerts,
  alertedPatients,
  patients,
  patientsCount,
  speciesBreakdown,
  weeklyCompletedAppointments,
  monthlyTreatmentCount,
  weeklyNewPatients,
  weeklyRevenue,
  activityFeed,
  profileViews,
  whatsappClicks,
  followerCount,
}: VetResumenProps) {
  const [portadaOpen, setPortadaOpen] = useState(false)
  const hasAlerts = treatmentAlerts.overdue > 0 || treatmentAlerts.upcoming > 0
  const conversionRate = profileViews > 0 ? Math.round((whatsappClicks / profileViews) * 100) : null

  return (
    <div className="space-y-6 pb-8 lg:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {logoUrl ? (
              <Image src={logoUrl} alt={shopName} fill className="object-cover" sizes="48px" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Stethoscope className="size-5" aria-hidden />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-heading leading-tight">{shopName}</h1>
            <p className="text-sm text-muted-foreground">Panel de tu veterinaria</p>
          </div>
        </div>
      </div>

      {hasAlerts && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Alertas</h2>
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="size-4 shrink-0 text-warning-foreground" aria-hidden />
            <p className="text-sm text-warning-foreground">
              {treatmentAlerts.overdue > 0 &&
                `${treatmentAlerts.overdue} pendiente${treatmentAlerts.overdue === 1 ? '' : 's'} vencido${treatmentAlerts.overdue === 1 ? '' : 's'}`}
              {treatmentAlerts.overdue > 0 && treatmentAlerts.upcoming > 0 && ' y '}
              {treatmentAlerts.upcoming > 0 &&
                `${treatmentAlerts.upcoming} próximo${treatmentAlerts.upcoming === 1 ? '' : 's'} a vencer`}
            </p>
          </div>
          {alertedPatients.length > 0 ? (
            alertedPatients.map((patient) => (
              <LinkCard key={patient.id} href={`/mi-tienda/pacientes/${patient.id}`} alert>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{patient.name}</span>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-xs text-warning-foreground">
                      {patient.overdue > 0 &&
                        `${patient.overdue} vencido${patient.overdue === 1 ? '' : 's'}`}
                      {patient.overdue > 0 && patient.upcoming > 0 && ' · '}
                      {patient.upcoming > 0 &&
                        `${patient.upcoming} próximo${patient.upcoming === 1 ? '' : 's'}`}
                    </span>
                    {patient.nextDueAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(patient.nextDueAt).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
              </LinkCard>
            ))
          ) : (
            <LinkCard href="/mi-tienda/pacientes" alert>
              <span className="text-sm">Ver pacientes</span>
            </LinkCard>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Acciones rápidas</h2>
        <Card className="overflow-visible">
          <CardContent className="space-y-3 pt-5">
            <div className="flex flex-wrap gap-2">
              <Button render={<Link href="/mi-tienda/pacientes/nuevo" />} nativeButton={false} size="sm">
                <PawPrint className="size-4" aria-hidden />
                Nuevo paciente
              </Button>
              <Button
                render={<Link href="/mi-tienda/turnos" />}
                nativeButton={false}
                variant="outline"
                size="sm"
              >
                <CalendarClock className="size-4" aria-hidden />
                Ver turnos
              </Button>
            </div>

            <QuickLogCard patients={patients} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Resumen</h2>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" aria-hidden />
              Pacientes
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-lg">{patientsCount}</span>
              {speciesBreakdown.length > 0 && (
                <span className="text-xs text-muted-foreground">({formatSpeciesBreakdown(speciesBreakdown)})</span>
              )}
            </div>
            <TrendDelta trend={weeklyNewPatients} label="esta semana" />
          </div>
          <div className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="size-4" aria-hidden />
              Turnos esta semana
            </span>
            <p className="font-heading text-lg">{weeklyCompletedAppointments.current}</p>
            <TrendDelta trend={weeklyCompletedAppointments} label="vs. semana pasada" />
          </div>
          <div className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Stethoscope className="size-4" aria-hidden />
              Tratamientos este mes
            </span>
            <p className="font-heading text-lg">{monthlyTreatmentCount.current}</p>
            <TrendDelta trend={monthlyTreatmentCount} label="vs. mes pasado" />
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm font-medium">Ingresos esta semana</p>
              <p className="font-heading text-2xl">{formatCurrency(weeklyRevenue.current)}</p>
            </div>
            <TrendDelta trend={weeklyRevenue} label="vs. semana pasada" format={formatCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="text-sm font-medium">Próximos turnos</p>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay turnos próximos. Van a aparecer acá apenas se agende uno.
              </p>
            ) : (
              <div className="space-y-1">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0"
                  >
                    <span className="truncate">{appointment.customer_name ?? 'Sin nombre'}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatDateTime(appointment.starts_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {activityFeed.length > 0 && (
          <div className="space-y-1 px-1">
            <p className="text-xs font-medium text-muted-foreground">Actividad reciente</p>
            {activityFeed.map((item, index) => (
              <Link
                key={`${item.kind}-${item.patientId}-${item.at}-${index}`}
                href={`/mi-tienda/pacientes/${item.patientId}`}
                className="flex items-center justify-between gap-2 py-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <History className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 font-mono">{formatDateTime(item.at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Tu perfil público</h2>
        <Collapsible
          open={portadaOpen}
          onOpenChange={setPortadaOpen}
          className="rounded-xl ring-1 ring-foreground/10"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors hover:text-foreground">
            <span>Portada, QR y compartir</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                portadaOpen && 'rotate-180'
              )}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="overflow-hidden border-t border-border">
              <ShopProfileHeader
                shopName={shopName}
                logoUrl={logoUrl}
                coverUrl={coverUrl}
                shopSlug={shopSlug}
                shopUrl={shopUrl}
                isVerified={isVerified}
                verificationStatus={verificationStatus}
                isPaused={isPaused}
                pausedReason={pausedReason}
                titleAs="h2"
              />

              <div className="space-y-3 px-4 py-4 md:px-6">
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="space-y-1 px-3 pt-4">
                      <Eye className="size-4 text-muted-foreground" aria-hidden />
                      <p className="truncate text-xs text-muted-foreground">Vistas</p>
                      <p className="font-heading text-xl font-mono">{profileViews}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-1 px-3 pt-4">
                      <MessageCircle className="size-4 text-muted-foreground" aria-hidden />
                      <p className="truncate text-xs text-muted-foreground">Clicks WhatsApp</p>
                      <p className="font-heading text-xl font-mono">{whatsappClicks}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-1 px-3 pt-4">
                      <Users className="size-4 text-muted-foreground" aria-hidden />
                      <p className="truncate text-xs text-muted-foreground">Seguidores</p>
                      <p className="font-heading text-xl font-mono">{followerCount}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardContent className="space-y-1 px-3 pt-4">
                    <Percent className="size-4 text-muted-foreground" aria-hidden />
                    <p className="truncate text-xs text-muted-foreground">Conversión (vistas → WhatsApp)</p>
                    <p className="font-heading text-xl font-mono">
                      {conversionRate === null ? '—' : `${conversionRate}%`}
                    </p>
                  </CardContent>
                </Card>

                <ShopLinkCard shopName={shopName} shopUrl={shopUrl} />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
