import Image from 'next/image'
import { cn } from '@/lib/utils'

export type TextPosition = 'top' | 'center' | 'bottom'
export type TextSize = 'sm' | 'md' | 'lg'

interface StoryPreviewProps {
  imageUrl: string | null
  text?: string | null
  productName?: string | null
  textPosition?: TextPosition
  textSize?: TextSize
  textColor?: string
  bgColor?: string
  header?: React.ReactNode
  className?: string
  emptyLabel?: string
  fill?: boolean
}

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl font-semibold',
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function StoryPreview({
  imageUrl,
  text,
  productName,
  textPosition = 'bottom',
  textSize = 'md',
  textColor = '#ffffff',
  bgColor = '#000000',
  header,
  className,
  emptyLabel = 'Subí una imagen para ver la vista previa',
  fill = false,
}: StoryPreviewProps) {
  const hasCaption = Boolean(text || productName)

  const captionStyle: React.CSSProperties =
    textPosition === 'center'
      ? { backgroundColor: hexToRgba(bgColor, 0.55) }
      : {
          background: `linear-gradient(to ${textPosition === 'top' ? 'bottom' : 'top'}, ${hexToRgba(
            bgColor,
            0.85
          )}, transparent)`,
        }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        fill ? 'absolute inset-0' : 'aspect-[9/16] w-full rounded-xl',
        className
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill className="object-cover" sizes="320px" />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      )}

      {header && (
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-3 pt-6">
          {header}
        </div>
      )}

      {hasCaption && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 p-4',
            textPosition === 'top' && 'top-0 pt-6',
            textPosition === 'center' && 'top-1/2 -translate-y-1/2 py-4 backdrop-blur-[2px]',
            textPosition === 'bottom' && 'bottom-0'
          )}
          style={{ ...captionStyle, color: textColor }}
        >
          {productName && <p className="text-xs font-medium opacity-70">{productName}</p>}
          {text && <p className={cn('mt-1 leading-relaxed', TEXT_SIZE_CLASSES[textSize])}>{text}</p>}
        </div>
      )}
    </div>
  )
}
