'use client'

import { getRubroIcon } from '@/lib/category-icons'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryGridProps {
  categories: Category[]
  onSelect: (id: string) => void
}

const TILE_COLORS = [
  'bg-primary/15 text-primary',
  'bg-destacado/25 text-destacado-foreground',
  'bg-verified/20 text-verified-foreground',
  'bg-success/25 text-success-foreground',
  'bg-warning/25 text-warning-foreground',
]

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  return (
    <div className="space-y-2">
      <h2 className="font-heading text-lg">Explorá por categoría</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = getRubroIcon(category.slug)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-full ${TILE_COLORS[index % TILE_COLORS.length]}`}
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
