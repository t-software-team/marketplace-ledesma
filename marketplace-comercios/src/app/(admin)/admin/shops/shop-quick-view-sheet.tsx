'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StatusBadge } from '@/components/shared/status-badge'
import type { getShopsForReview } from '@/lib/admin/queries'
import { formatDate, getInitials } from './shops-table-utils'

type Shop = Awaited<ReturnType<typeof getShopsForReview>>[number]

export function ShopQuickViewSheet({
  shop,
  onClose,
}: {
  shop: Shop | null
  onClose: () => void
}) {
  return (
    <Sheet open={shop !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {shop && (
          <>
            <SheetHeader>
              <Avatar size="lg" className="mb-2">
                <AvatarImage src={shop.logo_url ?? undefined} alt="" />
                <AvatarFallback>{getInitials(shop.name)}</AvatarFallback>
              </Avatar>
              <SheetTitle>{shop.name}</SheetTitle>
              <SheetDescription>Vista rápida del comercio</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-3 px-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ciudad</span>
                <span>{shop.city ?? 'Sin ciudad'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">WhatsApp</span>
                <span>{shop.whatsapp_number}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Registrado</span>
                <span>{formatDate(shop.created_at)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Productos</span>
                <span className="font-mono">{shop.product_count}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Plan</span>
                <span>{shop.active_plan_name ?? 'Free'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Estado</span>
                <div className="flex items-center gap-1.5">
                  {!shop.is_active && <StatusBadge status="rejected" label="Suspendido" />}
                  <StatusBadge status={shop.verification_status} />
                  {shop.open_reports_count > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" aria-hidden />
                      {shop.open_reports_count}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                render={<Link href={`/admin/shops/${shop.id}`} />}
                nativeButton={false}
                className="w-full"
              >
                Ver detalle completo
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
