import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedStampProps {
  className?: string
  showLabel?: boolean
}

export function VerifiedStamp({ className, showLabel = false }: VerifiedStampProps) {
  if (showLabel) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', className)}
        title="Comercio verificado"
      >
        <BadgeCheck className="size-4 shrink-0 fill-green-600 text-white" aria-hidden />
        <span className="text-sm leading-none font-medium text-green-700">Verificado</span>
      </span>
    )
  }

  return (
    <span
      className={cn('inline-flex size-5 shrink-0', className)}
      role="img"
      aria-label="Comercio verificado"
      title="Comercio verificado"
    >
      <BadgeCheck className="size-full fill-green-600 text-white" aria-hidden />
    </span>
  )
}
