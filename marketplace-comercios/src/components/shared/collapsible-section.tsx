'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  action?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

// Sección colapsable reutilizable para la ficha de paciente: título +
// chevron rotable como trigger, con un slot opcional de acción (ej. un
// botón/diálogo) que queda fuera del trigger para no anidar botones.
export function CollapsibleSection({
  title,
  action,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('space-y-3 border-t border-border pt-6', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger className="flex items-center gap-2 font-heading text-base">
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
            aria-hidden
          />
          {title}
        </CollapsibleTrigger>
        {action}
      </div>
      <CollapsibleContent>
        <div className="pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
