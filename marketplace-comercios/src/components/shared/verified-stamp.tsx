'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedStampProps {
  className?: string
}

export function VerifiedStamp({ className }: VerifiedStampProps) {
  return (
    <div
      className={cn(
        'relative flex size-8 items-center justify-center rounded-full border-2 border-verified bg-verified/20 ring-2 ring-verified/40 ring-offset-2 ring-offset-background',
        className
      )}
      aria-label="Comercio verificado"
      title="Comercio verificado"
    >
      <Check className="size-3.5 text-verified-foreground" aria-hidden />
      <span
        className="pointer-events-none absolute -bottom-2.5 left-1/2 text-[7px] font-semibold tracking-tight whitespace-nowrap text-verified-foreground [transform:translateX(-50%)_rotate(-8deg)]"
        aria-hidden
      >
        Verificado
      </span>
    </div>
  )
}
