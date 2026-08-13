import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, ExternalLink, FileText, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getShopForReview, getSubscriptionPlans } from '@/lib/admin/queries'
import { ShopVerificationActions } from './shop-verification-actions'
import { ShopSuspensionActions } from './shop-suspension-actions'
import { ShopPlanCard } from './shop-plan-card'

interface ShopDetailPageProps {
  params: Promise<{ id: string }>
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function StatTile({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: string
  value: number
  tone?: 'default' | 'destructive'
  href?: string
}) {
  const isAlert = tone === 'destructive' && value > 0
  const content = (
    <div
      className={cn(
        'rounded-xl p-3 ring-1',
        isAlert ? 'bg-destructive/10 ring-destructive/30' : 'bg-card ring-foreground/10'
      )}
    >
      <p
        className={cn(
          'font-mono text-xl font-semibold tabular-nums',
          isAlert && 'text-destructive'
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
    )
  }

  return content
}

export default async function ShopDetailPage({ params }: ShopDetailPageProps) {
  const { id } = await params
  const [shop, plans] = await Promise.all([getShopForReview(id), getSubscriptionPlans()])

  if (!shop) notFound()

  return (
    <div className="max-w-4xl space-y-4">
      <Button render={<Link href="/admin/shops" />} nativeButton={false} variant="ghost" size="sm">
        Volver
      </Button>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="relative h-24 bg-muted sm:h-32">
          {shop.cover_url && (
            <Image
              src={shop.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 1024px"
            />
          )}
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="-mt-10 flex items-end gap-3 sm:-mt-12">
            <Avatar size="lg" className="size-16 ring-4 ring-card sm:size-20 [&_[data-slot=avatar-fallback]]:text-lg">
              <AvatarImage src={shop.logo_url ?? undefined} alt="" />
              <AvatarFallback>{getInitials(shop.name)}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-heading">{shop.name}</h1>
                {!shop.is_active && <StatusBadge status="rejected" label="Suspendido" />}
                <StatusBadge status={shop.verification_status} />
              </div>
              {shop.slug && (
                <a
                  href={`/tienda/${shop.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                >
                  Ver perfil público
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {shop.verification_status === 'pending' && <ShopVerificationActions shopId={shop.id} />}
            <ShopSuspensionActions shopId={shop.id} isActive={shop.is_active} />
          </div>
        </div>
      </div>

      {!shop.is_active && shop.suspended_reason && (
        <p className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <strong>Motivo de la suspensión:</strong> {shop.suspended_reason}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Productos" value={shop.productCount} />
        <StatTile label="Vistas de perfil" value={shop.profile_views} />
        <StatTile label="Clicks WhatsApp" value={shop.whatsapp_clicks} />
        <StatTile
          label="Reportes abiertos"
          value={shop.openReportsCount}
          tone="destructive"
          href="/admin/reportes"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <MapPin className="size-4 text-muted-foreground" aria-hidden />
              <CardTitle className="text-sm font-medium text-muted-foreground">Datos del comercio</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Ciudad</dt>
                  <dd>{shop.city ?? 'Sin ciudad'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">WhatsApp</dt>
                  <dd className="font-mono">{shop.whatsapp_number}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd>{shop.email ?? 'Sin email'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Dirección</dt>
                  <dd>{shop.address ?? 'Sin dirección'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <FileText className="size-4 text-muted-foreground" aria-hidden />
              <CardTitle className="text-sm font-medium text-muted-foreground">Documento de verificación</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {shop.documentUrl ? (
                <a
                  href={shop.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Ver documento
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No se subió ningún documento</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ShopPlanCard
            shopId={shop.id}
            activePlanId={shop.activePlanId}
            plans={plans.filter((plan) => plan.is_active).map((plan) => ({ id: plan.id, name: plan.name, price: plan.price }))}
          />

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              <CardTitle className="text-sm font-medium text-muted-foreground">Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Última actividad</span>
                <span>{formatRelativeTime(shop.updated_at)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Registrado el</span>
                <span className="font-mono">{new Date(shop.created_at).toLocaleDateString('es-AR')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
