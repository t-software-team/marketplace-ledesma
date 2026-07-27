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
        'flex size-8 items-center justify-center rounded-full border-2 border-verified bg-verified/20',
        className
      )}
      aria-label="Comercio verificado"
      title="Comercio verificado"
    >
      <Check className="size-3.5 text-verified-foreground" aria-hidden />
    </div>
  )
}
