'use client'

import { useRef } from 'react'
import { getRubroIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface ShopsFiltersProps {
  categories: Category[]
  categoryId: string | null
  onCategoryChange: (id: string | null) => void
}

export function ShopsFilters({ categories, categoryId, onCategoryChange }: ShopsFiltersProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    event.preventDefault()
    el.scrollLeft += event.deltaY
  }

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className="flex shrink-0 flex-col items-center gap-1.5"
      >
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full border-2 bg-surface text-xs font-medium transition-colors',
            categoryId === null
              ? 'border-primary text-primary'
              : 'border-border text-muted-foreground'
          )}
        >
          Todos
        </span>
        <span
          className={cn(
            'text-xs',
            categoryId === null ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          Todos
        </span>
      </button>

      {categories.map((category) => {
        const Icon = getRubroIcon(category.slug)
        const isSelected = categoryId === category.id
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(isSelected ? null : category.id)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                'flex size-14 items-center justify-center rounded-full border-2 bg-surface transition-colors',
                isSelected ? 'border-primary text-primary' : 'border-border text-muted-foreground'
              )}
            >
              <Icon className="size-6" aria-hidden />
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
