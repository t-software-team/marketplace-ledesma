'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface AttributeDef {
  id: string
  key: string
  label: string
  type: string
  options: unknown
}

interface AttributeFilterSheetProps {
  attributes: AttributeDef[]
  selectedValue: string | null
  onSelect: (value: string | null) => void
}

export function AttributeFilterSheet({ attributes, selectedValue, onSelect }: AttributeFilterSheetProps) {
  const [open, setOpen] = useState(false)

  if (attributes.length === 0) return null

  function handleSelect(value: string | null) {
    onSelect(value)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
        nativeButton={true}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden />
        {selectedValue ?? 'Más filtros'}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filtrar</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          {selectedValue && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="text-sm font-medium text-primary underline"
            >
              Limpiar filtro
            </button>
          )}
          {attributes.map((attribute) => {
            const options = Array.isArray(attribute.options) ? attribute.options : []
            return (
              <div key={attribute.id} className="space-y-2">
                <p className="text-sm font-medium">{attribute.label}</p>

                {attribute.type === 'multicolor' ? (
                  <div className="flex flex-wrap gap-2">
                    {(options as { label: string; hex: string }[]).map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => handleSelect(color.hex)}
                        title={color.label}
                        aria-label={color.label}
                        style={{ backgroundColor: color.hex }}
                        className={cn(
                          'size-8 shrink-0 rounded-full border-2',
                          selectedValue === color.hex ? 'border-primary' : 'border-border'
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(options as string[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={cn(
                          'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                          selectedValue === option
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
