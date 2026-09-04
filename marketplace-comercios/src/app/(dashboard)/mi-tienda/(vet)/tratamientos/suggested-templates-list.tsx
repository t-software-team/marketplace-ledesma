'use client'

import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { createTreatmentTemplateFromSuggestion } from '@/lib/treatments/actions'
import { SUGGESTED_TREATMENT_TEMPLATES } from '@/lib/treatments/suggested-templates'

const SPECIES_LABELS: Record<string, string> = { perro: 'Perro', gato: 'Gato' }

// Catálogo de plantillas sugeridas por especie (datos default en código, no
// tocan la DB). Al elegir una se dispara createTreatmentTemplateFromSuggestion
// que inserta el template + sus dosis de una sola vez.
export function SuggestedTemplatesList() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleUse(key: string) {
    startTransition(async () => {
      const result = await createTreatmentTemplateFromSuggestion(key)
      if (result.error) {
        toast.add({ title: 'No pudimos crear la plantilla', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Plantilla creada', type: 'success' })
      }
    })
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl ring-1 ring-foreground/10">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors hover:text-foreground">
        <span>Usar plantilla sugerida</span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 border-t border-border p-4">
          {SUGGESTED_TREATMENT_TEMPLATES.map((suggestion) => (
            <div
              key={suggestion.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {suggestion.name} · {SPECIES_LABELS[suggestion.species]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.doses.length} dosis · {suggestion.doses.map((d) => d.label).join(' → ')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleUse(suggestion.key)}
              >
                Usar
              </Button>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
