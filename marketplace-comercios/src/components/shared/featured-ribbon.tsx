import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeaturedRibbonProps {
  className?: string
  variant?: 'corner' | 'floating' | 'inline'
}

export function FeaturedRibbon({ className, variant = 'corner' }: FeaturedRibbonProps) {
  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-br from-primary to-primary/80 px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm shadow-primary/30',
          className
        )}
      >
        <Sparkles className="size-2.5" aria-hidden />
        Destacado
      </span>
    )
  }

  if (variant === 'floating') {
    return (
      <div
        className={cn(
          'absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-primary to-primary/80 px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-white/20',
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
        'absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-primary to-primary/80 px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm shadow-primary/30',
        className
      )}
      aria-label="Comercio destacado"
    >
      <Sparkles className="size-2.5" aria-hidden />
      Destacado
    </div>
  )
}
