'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { logShopContact } from '@/lib/shops/actions'
import { toWhatsAppNumber } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phoneNumber: string
  message?: string
  shopId?: string
  productId?: string
  className?: string
  compact?: boolean
}

export function WhatsAppButton({
  phoneNumber,
  message = 'Hola, vi tu tienda en Proxi Marketplace',
  shopId,
  productId,
  className,
  compact = false,
}: WhatsAppButtonProps) {
  const sanitizedPhone = toWhatsAppNumber(phoneNumber)
  const url = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`

  async function handleClick() {
    if (!shopId) return

    const supabase = createClient()
    await Promise.all([
      supabase.rpc('increment_shop_metric', {
        p_shop_id: shopId,
        p_metric: 'whatsapp_click',
      }),
      logShopContact(shopId, productId),
    ])
  }

  return (
    <Button
      size="lg"
      className={cn('h-12 gap-2 px-5 text-base', className)}
      render={
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void handleClick()}
        />
      }
      nativeButton={false}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="size-5" />
      {compact ? 'Contactar' : 'Contactar por WhatsApp'}
    </Button>
  )
}
