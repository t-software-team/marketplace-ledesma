import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { StatusBadge } from '@/components/shared/status-badge'
import { getShopsForReview } from '@/lib/admin/queries'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR')
}

export default async function AdminShopsPage() {
  const shops = await getShopsForReview()

  const groups: Record<'pending' | 'verified' | 'rejected' | 'all', typeof shops> = {
    pending: shops.filter((shop) => shop.verification_status === 'pending'),
    verified: shops.filter((shop) => shop.verification_status === 'verified'),
    rejected: shops.filter((shop) => shop.verification_status === 'rejected'),
    all: shops,
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Comercios</h1>
        <p className="text-sm text-muted-foreground">
          Verificación de comercios registrados
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="verified">Verificados ({groups.verified.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados ({groups.rejected.length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({groups.all.length})</TabsTrigger>
        </TabsList>

        {(Object.keys(groups) as Array<keyof typeof groups>).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3 pt-3">
            {groups[key].length === 0 ? (
              <EmptyState
                illustration={<EmptyBoxIllustration />}
                message="No hay comercios en esta categoría."
              />
            ) : (
              groups[key].map((shop) => (
                <Card key={shop.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{shop.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {shop.city ?? 'Sin ciudad'} · {shop.whatsapp_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registrado el {formatDate(shop.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={shop.verification_status} />
                    <Button
                      render={<Link href={`/admin/shops/${shop.id}`} />}
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                    >
                      Ver detalle
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
