'use client'

import { QRCodeSVG } from 'qrcode.react'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ShopQrDialogProps {
  shopName: string
  shopUrl: string
}

export function ShopQrDialog({ shopName, shopUrl }: ShopQrDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" className="flex-1 gap-2" aria-label="Ver código QR" />
        }
      >
        <QrCode className="size-4" />
        QR
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR de {shopName}</DialogTitle>
          <DialogDescription>
            Escaneá o compartí este código para abrir el perfil de la tienda
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-xl border border-border bg-surface p-4">
          <QRCodeSVG value={shopUrl} size={200} />
        </div>
        <p className="break-all text-center font-mono text-xs text-muted-foreground">
          {shopUrl}
        </p>
      </DialogContent>
    </Dialog>
  )
}
