'use client'

import { getRubroIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryGridProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex shrink-0 flex-col items-center gap-1.5"
      >
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full border-2 bg-surface text-xs font-medium transition-colors',
            selectedId === null
              ? 'border-primary text-primary'
              : 'border-border text-muted-foreground'
          )}
        >
          Todas
        </span>
        <span
          className={cn(
            'text-xs',
            selectedId === null ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          Todo
        </span>
      </button>

      {categories.map((category) => {
        const Icon = getRubroIcon(category.slug)
        const isSelected = selectedId === category.id
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : category.id)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <span className="relative">
              <span
                className={cn(
                  'flex size-14 items-center justify-center rounded-full border-2 bg-surface transition-colors',
                  isSelected ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                )}
              >
                <Icon className="size-6" aria-hidden />
              </span>
            </span>
            <span
              className={cn(
                'max-w-16 truncate text-xs',
                isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}
            >
              {category.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
