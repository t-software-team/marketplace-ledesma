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

const TILE_STYLES = [
  {
    card: 'bg-gradient-to-br from-primary/10 via-surface to-surface',
    badge: 'bg-gradient-to-br from-primary/25 to-primary/10 text-primary',
    glow: 'bg-primary',
    hover: 'hover:border-primary/60 hover:shadow-primary/15',
  },
  {
    card: 'bg-gradient-to-br from-destacado/15 via-surface to-surface',
    badge: 'bg-gradient-to-br from-destacado/35 to-destacado/10 text-destacado-foreground',
    glow: 'bg-destacado',
    hover: 'hover:border-destacado/60 hover:shadow-destacado/15',
  },
  {
    card: 'bg-gradient-to-br from-verified/12 via-surface to-surface',
    badge: 'bg-gradient-to-br from-verified/30 to-verified/10 text-verified-foreground',
    glow: 'bg-verified',
    hover: 'hover:border-verified/60 hover:shadow-verified/15',
  },
  {
    card: 'bg-gradient-to-br from-success/15 via-surface to-surface',
    badge: 'bg-gradient-to-br from-success/35 to-success/10 text-success-foreground',
    glow: 'bg-success',
    hover: 'hover:border-success/60 hover:shadow-success/15',
  },
  {
    card: 'bg-gradient-to-br from-warning/15 via-surface to-surface',
    badge: 'bg-gradient-to-br from-warning/35 to-warning/10 text-warning-foreground',
    glow: 'bg-warning',
    hover: 'hover:border-warning/60 hover:shadow-warning/15',
  },
]

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  return (
    <div className="space-y-2">
      <h2 className="font-heading text-lg">Explorá por categoría</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = getRubroIcon(category.slug)
          const style = TILE_STYLES[index % TILE_STYLES.length]
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border px-4 py-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${style.card} ${style.hover}`}
            >
              <span
                className={`absolute -top-6 -right-6 size-20 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25 ${style.glow}`}
                aria-hidden
              />
              <span
                className={`relative flex size-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110 ${style.badge}`}
              >
                <Icon className="size-7" aria-hidden />
              </span>
              <span className="relative text-sm font-medium">{category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
