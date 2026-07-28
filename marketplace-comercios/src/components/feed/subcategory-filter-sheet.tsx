'use client'

import { useState } from 'react'
import { ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface Subcategory {
  id: string
  name: string
}

interface SubcategoryFilterSheetProps {
  subcategories: Subcategory[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function SubcategoryFilterSheet({
  subcategories,
  selectedId,
  onSelect,
}: SubcategoryFilterSheetProps) {
  const [open, setOpen] = useState(false)
  const selectedName = subcategories.find((sub) => sub.id === selectedId)?.name

  function handleSelect(id: string | null) {
    onSelect(id)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
        nativeButton={true}
      >
        <ListFilter className="size-3.5" aria-hidden />
        {selectedName ?? 'Filtrar por tipo'}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filtrar por tipo</SheetTitle>
        </SheetHeader>
        <div className="flex flex-wrap gap-2 overflow-y-auto px-4 pb-6">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
              selectedId === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            )}
          >
            Todos
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSelect(sub.id)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                selectedId === sub.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-surface text-muted-foreground hover:text-foreground'
              )}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
