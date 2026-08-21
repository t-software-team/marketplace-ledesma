'use client'

import { useState } from 'react'
import { ShopsFilters } from './shops-filters'
import { ShopsGrid } from './shops-grid'
import type { FeaturedShop } from '@/hooks/use-products'

interface Category {
  id: string
  name: string
  slug: string
}

interface ComerciosPageClientProps {
  initialShops: FeaturedShop[] | undefined
  categories: Category[]
}

export function ComerciosPageClient({ initialShops, categories }: ComerciosPageClientProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <ShopsFilters
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />
      <ShopsGrid initialShops={initialShops} categoryId={categoryId} />
    </div>
  )
}
