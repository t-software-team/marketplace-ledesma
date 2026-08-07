'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export function SubscriptionBenefits({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false)

  if (lines.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <span>Beneficios incluidos ({lines.length})</span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="grid gap-1.5 pb-3 text-xs text-muted-foreground sm:grid-cols-2">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
