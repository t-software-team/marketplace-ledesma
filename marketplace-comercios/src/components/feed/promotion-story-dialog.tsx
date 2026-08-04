'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Download, MessageCircle, Store, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FacebookIcon } from '@/components/shared/facebook-icon'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { VerifiedStamp } from '@/components/shared/verified-stamp'
import { toast } from '@/components/ui/toast'
import { toWhatsAppNumber } from '@/lib/whatsapp'
import { StoryPreview, type TextPosition, type TextSize } from './story-preview'

const STORY_DURATION_MS = 6000

export interface StoryPromotion {
  id: string
  shopId: string
  imageUrl: string
  text: string | null
  shopName: string
  shopSlug: string
  shopLogoUrl: string | null
  shopWhatsapp: string
  isVerified?: boolean
  productName?: string | null
  shopUrl: string
  textPosition?: TextPosition
  textSize?: TextSize
  textColor?: string
  bgColor?: string
}

interface PromotionStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotions: StoryPromotion[]
  activeIndex: number
  onIndexChange: (index: number) => void
}

export function PromotionStoryDialog({
  open,
  onOpenChange,
  promotions,
  activeIndex,
  onIndexChange,
}: PromotionStoryDialogProps) {
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number>(0)
  const frameRef = useRef<number | undefined>(undefined)

  const promotion = promotions[activeIndex]

  function goNext() {
    if (activeIndex >= promotions.length - 1) {
      onOpenChange(false)
      return
    }
    onIndexChange(activeIndex + 1)
  }

  function goPrevious() {
    if (activeIndex <= 0) return
    onIndexChange(activeIndex - 1)
  }

  useEffect(() => {
    if (!open) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the requestAnimationFrame progress loop when the story changes, not a props sync
    setProgress(0)
    startRef.current = Date.now()

    function tick() {
      const elapsed = Date.now() - startRef.current
      const next = Math.min(1, elapsed / STORY_DURATION_MS)
      setProgress(next)
      if (next >= 1) {
        goNext()
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart the timer only when the story or open state changes
  }, [open, activeIndex])

  if (!promotion) return null

  const shareText = promotion.text ?? `¡Mirá esta promo de ${promotion.shopName}!`

  async function handleShareImage(forceDownload = false) {
    try {
      const response = await fetch(promotion.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'promo.jpg', { type: blob.type || 'image/jpeg' })

      if (!forceDownload && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, title: promotion.shopName })
        return
      }

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'promo.jpg'
      link.click()
      URL.revokeObjectURL(link.href)
      toast.add({
        title: 'Imagen descargada',
        description: 'Subila como historia desde la app de Instagram',
        type: 'success',
      })
    } catch (error) {
      console.error('PromotionStoryDialog: fallo al compartir imagen', error)
      toast.add({ title: 'No pudimos compartir la imagen', type: 'error' })
    }
  }

  function handleWhatsAppShare() {
    const phone = toWhatsAppNumber(promotion.shopWhatsapp)
    const message = `${shareText} ${promotion.shopUrl}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  function handleFacebookShare() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(promotion.shopUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-full max-w-sm overflow-hidden border-none bg-black p-0 sm:rounded-2xl">
        <div className="relative flex h-full flex-col">
          <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
            {promotions.map((item, index) => (
              <div key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white"
                  style={{
                    width:
                      index < activeIndex ? '100%' : index === activeIndex ? `${progress * 100}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute top-5 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          >
            <X className="size-4" aria-hidden />
          </button>

          <div className="relative flex-1">
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Promoción anterior"
              className="absolute inset-y-0 left-0 z-[5] w-1/3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            />
            <button
              type="button"
              onClick={goNext}
              aria-label="Siguiente promoción"
              className="absolute inset-y-0 right-0 z-[5] w-2/3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            />

            <StoryPreview
              fill
              imageUrl={promotion.imageUrl}
              text={promotion.text}
              productName={promotion.productName}
              textPosition={promotion.textPosition}
              textSize={promotion.textSize}
              textColor={promotion.textColor}
              bgColor={promotion.bgColor}
              header={
                <Link
                  href={`/tienda/${promotion.shopSlug}`}
                  className="flex items-center gap-2 text-white"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/40">
                    {promotion.shopLogoUrl ? (
                      <Image
                        src={promotion.shopLogoUrl}
                        alt={`Logo de ${promotion.shopName}`}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="size-4" aria-hidden />
                      </div>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {promotion.shopName}
                    {promotion.isVerified && <VerifiedStamp className="size-4" />}
                  </span>
                </Link>
              }
            />
          </div>

          <div className="grid grid-cols-4 gap-2 bg-background p-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-4.5 text-success" aria-hidden />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FacebookIcon className="size-4.5 text-[#1877F2]" />
              Facebook
            </button>
            <button
              type="button"
              onClick={() => handleShareImage(false)}
              className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <InstagramIcon className="size-4.5" />
              Instagram
            </button>
            <button
              type="button"
              onClick={() => handleShareImage(true)}
              className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="size-4.5" aria-hidden />
              Guardar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
