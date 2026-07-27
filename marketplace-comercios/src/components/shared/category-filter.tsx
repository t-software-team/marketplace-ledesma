'use client'

import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  className?: string
}

export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
  className,
}: CategoryFilterProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
          selectedId === null
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-surface text-muted-foreground hover:text-foreground'
        )}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
            selectedId === category.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-surface text-muted-foreground hover:text-foreground'
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
