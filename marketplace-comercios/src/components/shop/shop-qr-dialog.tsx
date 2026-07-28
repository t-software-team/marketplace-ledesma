'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, QrCode } from 'lucide-react'
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
  triggerVariant?: 'default' | 'icon'
}

export function ShopQrDialog({ shopName, shopUrl, triggerVariant = 'default' }: ShopQrDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleDownload() {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const image = new Image()
    image.onload = () => {
      const padding = 24
      const canvas = document.createElement('canvas')
      canvas.width = image.width + padding * 2
      canvas.height = image.height + padding * 2

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(svgUrl)
        return
      }

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, padding, padding)
      URL.revokeObjectURL(svgUrl)

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return
        const pngUrl = URL.createObjectURL(pngBlob)
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `qr-${shopName.toLowerCase().replace(/\s+/g, '-')}.png`
        link.click()
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')
    }
    image.src = svgUrl
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          triggerVariant === 'icon' ? (
            <Button variant="outline" size="icon" aria-label="Ver código QR" />
          ) : (
            <Button variant="outline" className="flex-1 gap-2" aria-label="Ver código QR" />
          )
        }
      >
        <QrCode className="size-4" />
        {triggerVariant === 'default' && 'QR'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR de {shopName}</DialogTitle>
          <DialogDescription>
            Escaneá o compartí este código para abrir el perfil de la tienda
          </DialogDescription>
        </DialogHeader>
        <div
          ref={containerRef}
          className="flex justify-center rounded-xl border border-border bg-surface p-4"
        >
          <QRCodeSVG value={shopUrl} size={200} />
        </div>
        <p className="break-all text-center font-mono text-xs text-muted-foreground">
          {shopUrl}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          onClick={handleDownload}
          aria-label="Descargar código QR"
        >
          <Download className="size-4" />
          Descargar QR
        </Button>
      </DialogContent>
    </Dialog>
  )
}
