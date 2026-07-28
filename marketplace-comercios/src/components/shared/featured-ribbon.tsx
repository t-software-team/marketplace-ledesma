import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeaturedRibbonProps {
  className?: string
  variant?: 'corner' | 'floating'
}

export function FeaturedRibbon({ className, variant = 'corner' }: FeaturedRibbonProps) {
  if (variant === 'floating') {
    return (
      <div
        className={cn(
          'absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-destacado px-2.5 py-1 text-xs font-medium text-destacado-foreground shadow-md ring-1 ring-black/5',
          className
        )}
        aria-label="Comercio destacado"
      >
        <Sparkles className="size-3.5" aria-hidden />
        Destacado
      </div>
    )
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-0 rounded-br-lg bg-destacado px-2 py-0.5 text-[10px] font-medium text-destacado-foreground',
        className
      )}
      aria-label="Comercio destacado"
    >
      Destacado
    </div>
  )
}
