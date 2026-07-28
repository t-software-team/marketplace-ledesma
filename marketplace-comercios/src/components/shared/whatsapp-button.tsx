'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phoneNumber: string
  message?: string
  shopId?: string
  className?: string
}

export function WhatsAppButton({
  phoneNumber,
  message = 'Hola, vi tu tienda en Marketplace Ledesma',
  shopId,
  className,
}: WhatsAppButtonProps) {
  const sanitizedPhone = phoneNumber.replace(/\D/g, '')
  const url = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`

  async function handleClick() {
    if (!shopId) return

    const supabase = createClient()
    await supabase.rpc('increment_shop_metric', {
      p_shop_id: shopId,
      p_metric: 'whatsapp_click',
    })
  }

  return (
    <Button
      className={cn('gap-2', className)}
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
      <MessageCircle className="size-4" />
      Contactar por WhatsApp
    </Button>
  )
}
