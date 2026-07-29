'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ShareButton } from '@/components/shared/share-button'
import { StoryPreview, type TextPosition, type TextSize } from '@/components/feed/story-preview'
import { toast } from '@/components/ui/toast'
import { deletePromotion } from '@/lib/shops/actions'

interface PromotionCardProps {
  id: string
  imageUrl: string
  text: string | null
  expiresAt: string
  productName?: string | null
  shopUrl: string
  textPosition: TextPosition
  textSize: TextSize
  textColor: string
  bgColor: string
}

function formatTimeLeft(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Vencida'
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 24) return `Vence en ${hours}h`
  const days = Math.ceil(hours / 24)
  return `Vence en ${days}d`
}

export function PromotionCard({
  id,
  imageUrl,
  text,
  expiresAt,
  productName,
  shopUrl,
  textPosition,
  textSize,
  textColor,
  bgColor,
}: PromotionCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePromotion(id)
        toast.add({ title: 'Promoción eliminada', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos eliminar la promoción', type: 'error' })
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <StoryPreview
        imageUrl={imageUrl}
        text={text}
        productName={productName}
        textPosition={textPosition}
        textSize={textSize}
        textColor={textColor}
        bgColor={bgColor}
        className="rounded-none"
      />
      <div className="space-y-2 p-3">
        <p className="text-xs font-medium text-primary">{formatTimeLeft(expiresAt)}</p>
        <div className="flex gap-2">
          <ShareButton
            title="Promoción"
            text={text ?? '¡Mirá esta promo!'}
            url={shopUrl}
            variant="outline"
            size="sm"
            className="flex-1"
          />
          <ConfirmDialog
            trigger={<Button variant="outline" size="icon-sm" className="text-destructive" />}
            triggerLabel={<Trash2 className="size-4" aria-hidden />}
            title="¿Eliminar esta promoción?"
            description="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            isConfirming={isPending}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}
