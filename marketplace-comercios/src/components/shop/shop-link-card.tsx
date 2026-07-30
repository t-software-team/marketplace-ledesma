'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShareButton } from '@/components/shared/share-button'
import { ShopQrDialog } from '@/components/shop/shop-qr-dialog'
import { toast } from '@/components/ui/toast'

interface ShopLinkCardProps {
  shopName: string
  shopUrl: string
}

export function ShopLinkCard({ shopName, shopUrl }: ShopLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const displayUrl = shopUrl.replace(/^https?:\/\//, '')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shopUrl)
      setCopied(true)
      toast.add({ title: 'Link copiado', type: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('ShopLinkCard: fallo al copiar', error)
      toast.add({ title: 'No pudimos copiar el link', type: 'error' })
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center gap-2">
          <Share2 className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium">Compartí tu tienda y mirá crecer estos números</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">{displayUrl}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Pegalo en tu bio de Instagram, en tus historias o mandalo por WhatsApp. El código QR es
          ideal para imprimir y pegar en tu local.
        </p>

        <div className="flex gap-2">
          <ShopQrDialog shopName={shopName} shopUrl={shopUrl} />
          <ShareButton title={shopName} text={`Mirá ${shopName} en Todo Marketplace`} url={shopUrl} />
        </div>
      </CardContent>
    </Card>
  )
}
