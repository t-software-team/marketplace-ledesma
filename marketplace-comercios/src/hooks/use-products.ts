import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFiltersStore } from '@/stores/use-filters-store'

export function useProductsFeed() {
  const { categoryId, searchQuery, userLocation } = useFiltersStore()
  const supabase = createClient()
  const seedRef = useRef<string | null>(null)
  if (seedRef.current === null) {
    seedRef.current = crypto.randomUUID()
  }

  return useQuery({
    queryKey: ['products-feed', categoryId, searchQuery, userLocation],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_products_feed', {
        user_lat: userLocation?.lat,
        user_lng: userLocation?.lng,
        p_category_id: categoryId ?? undefined,
        p_search: searchQuery || undefined,
        p_seed: seedRef.current ?? undefined,
      })
      if (error) throw error
      return data
    },
  })
}

export interface ShopSearchResult {
  id: string
  name: string
  slug: string
  logo_url: string | null
  city: string | null
  verification_status: string
}

export function useShopSearch() {
  const { searchQuery } = useFiltersStore()
  const supabase = createClient()
  const trimmed = searchQuery.trim()

  return useQuery({
    queryKey: ['shop-search', trimmed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, slug, logo_url, city, verification_status')
        .ilike('name', `%${trimmed}%`)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(4)
      if (error) throw error
      return data as ShopSearchResult[]
    },
    enabled: trimmed.length >= 2,
  })
}