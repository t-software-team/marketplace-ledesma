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
  Store,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ShopLinkCard } from '@/components/shop/shop-link-card'
import { ShopQrDialog } from '@/components/shop/shop-qr-dialog'
import { ShareButton } from '@/components/shared/share-button'
import { StatusBadge } from '@/components/shared/status-badge'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { cn } from '@/lib/utils'
import type { AppointmentRow } from '@/lib/turnos/queries'
import type { ShopReminderAlerts } from '@/lib/patients/alerts'
import type { ActivityFeedItem, SpeciesBreakdownItem } from '@/lib/patients/dashboard-queries'
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

interface VetResumenProps {
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
  weeklyCompletedAppointments: number
  monthlyTreatmentCount: number
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
        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4 lg:space-y-0">
          <Card className="lg:col-span-1">
            <CardContent className="grid grid-cols-3 gap-3 pt-5 lg:grid-cols-1 lg:divide-y lg:divide-border/50">
              <div className="space-y-1 lg:pb-3">
                <Users className="size-4 text-muted-foreground" aria-hidden />
                <p className="text-xs text-muted-foreground">Pacientes</p>
                <p className="font-heading text-2xl">{patientsCount}</p>
                {speciesBreakdown.length > 0 && (
                  <p className="text-xs text-muted-foreground">{formatSpeciesBreakdown(speciesBreakdown)}</p>
                )}
              </div>
              <div className="space-y-1 lg:py-3">
                <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                <p className="text-xs text-muted-foreground">Turnos esta semana</p>
                <p className="font-heading text-2xl">{weeklyCompletedAppointments}</p>
              </div>
              <div className="space-y-1 lg:pt-3">
                <Stethoscope className="size-4 text-muted-foreground" aria-hidden />
                <p className="text-xs text-muted-foreground">Tratamientos este mes</p>
                <p className="font-heading text-2xl">{monthlyTreatmentCount}</p>
              </div>
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
                      className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm last:border-0"
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

          <Card>
            <CardContent className="space-y-2 pt-6">
              <p className="text-sm font-medium">Actividad reciente</p>
              {activityFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay actividad reciente.</p>
              ) : (
                <div className="space-y-1">
                  {activityFeed.map((item, index) => (
                    <Link
                      key={`${item.kind}-${item.patientId}-${item.at}-${index}`}
                      href={`/mi-tienda/pacientes/${item.patientId}`}
                      className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm transition-colors last:border-0 hover:text-primary"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <History className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatDateTime(item.at)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/mi-tienda/pacientes" />} nativeButton={false} variant="outline">
          Pacientes
        </Button>
        <Button render={<Link href="/mi-tienda/tratamientos" />} nativeButton={false} variant="outline">
          Tratamientos
        </Button>
        <Button render={<Link href="/mi-tienda/turnos" />} nativeButton={false} variant="outline">
          Turnos
        </Button>
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
              <div className="relative h-28 bg-gradient-to-br from-primary/30 to-destacado/30 sm:h-36">
                {coverUrl && (
                  <Image
                    src={coverUrl}
                    alt={`Portada de ${shopName}`}
                    fill
                    className="object-cover"
                    sizes="768px"
                  />
                )}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4">
                <div className="flex items-end gap-3">
                  <div className="relative -mt-8 size-16 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-muted sm:size-20">
                    {logoUrl ? (
                      <Image src={logoUrl} alt={shopName} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Store className="size-6" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="pb-0.5">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xl font-heading sm:text-2xl">{shopName}</h2>
                      {isVerified && <VerifiedStamp className="size-6" />}
                    </div>
                    {isPaused ? (
                      <Badge variant="warning" className="mt-1">
                        En pausa{pausedReason ? `: ${pausedReason}` : ''}
                      </Badge>
                    ) : (
                      <StatusBadge status={verificationStatus} className="mt-1" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <ShopQrDialog shopName={shopName} shopUrl={shopUrl} triggerVariant="icon" />
                  <ShareButton
                    title={shopName}
                    text={`Mirá ${shopName} en Proxi Marketplace`}
                    url={shopUrl}
                    variant="outline"
                    size="icon"
                  />
                  <Button
                    render={<Link href={`/tienda/${shopSlug}`} target="_blank" />}
                    nativeButton={false}
                    variant="outline"
                    className="gap-1.5"
                  >
                    Ver tienda pública
                  </Button>
                </div>
              </div>

              <div className="border-t border-border px-4 py-3 md:px-6">
                <ShareButton
                  title={shopName}
                  text={`¿Nos regalás una reseña en Proxi? Contanos cómo te fue con ${shopName}:`}
                  url={shopUrl}
                  variant="ghost"
                  size="sm"
                  icon="star"
                  label="Invitar a reseñar"
                  copiedLabel="Link copiado"
                  className="w-full justify-center sm:w-auto"
                />
              </div>

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
