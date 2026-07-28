import { cn } from '@/lib/utils'

interface FeaturedRibbonProps {
  className?: string
}

export function FeaturedRibbon({ className }: FeaturedRibbonProps) {
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
