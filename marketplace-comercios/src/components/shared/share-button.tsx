'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  title: string
  text: string
  url: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'icon'
}

export function ShareButton({
  title,
  text,
  url,
  className,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('ShareButton: fallo al compartir', error)
        }
      }
      return
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      toast.add({ title: 'Link copiado', type: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('ShareButton: fallo al copiar', error)
      toast.add({ title: 'No pudimos copiar el link', type: 'error' })
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('gap-1.5', className)}
      onClick={handleShare}
      aria-label={size === 'icon' ? (copied ? 'Link copiado' : 'Compartir') : undefined}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {size !== 'icon' && (copied ? 'Copiado' : 'Compartir')}
    </Button>
  )
}
