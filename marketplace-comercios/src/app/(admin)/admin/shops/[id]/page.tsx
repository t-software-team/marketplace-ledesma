import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { getShopForReview } from '@/lib/admin/queries'
import { ShopVerificationActions } from './shop-verification-actions'
import { ShopSuspensionActions } from './shop-suspension-actions'

interface ShopDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ShopDetailPage({ params }: ShopDetailPageProps) {
  const { id } = await params
  const shop = await getShopForReview(id)

  if (!shop) notFound()

  return (
    <div className="max-w-2xl space-y-4">
      <Button render={<Link href="/admin/shops" />} nativeButton={false} variant="ghost" size="sm">
        Volver
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">{shop.name}</h1>
        <div className="flex items-center gap-2">
          {!shop.is_active && <StatusBadge status="rejected" label="Suspendido" />}
          <StatusBadge status={shop.verification_status} />
        </div>
      </div>

      {!shop.is_active && shop.suspended_reason && (
        <p className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <strong>Motivo de la suspensión:</strong> {shop.suspended_reason}
        </p>
      )}

      <div className="flex justify-end">
        <ShopSuspensionActions shopId={shop.id} isActive={shop.is_active} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <MapPin className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle className="text-sm font-medium text-muted-foreground">Datos del comercio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4 text-sm">
          <p>
            <span className="text-muted-foreground">Ciudad:</span> {shop.city ?? 'Sin ciudad'}
          </p>
          <p>
            <span className="text-muted-foreground">WhatsApp:</span>{' '}
            <span className="font-mono">{shop.whatsapp_number}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {shop.email ?? 'Sin email'}
          </p>
          <p>
            <span className="text-muted-foreground">Dirección:</span> {shop.address ?? 'Sin dirección'}
          </p>
          <p>
            <span className="text-muted-foreground">Registrado el:</span>{' '}
            <span className="font-mono">{new Date(shop.created_at).toLocaleDateString('es-AR')}</span>
          </p>
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

      {shop.verification_status === 'pending' && <ShopVerificationActions shopId={shop.id} />}
    </div>
  )
}
