import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFiltersStore } from '@/stores/use-filters-store'

export function useProductsFeed() {
  const { categoryId, searchQuery, userLocation } = useFiltersStore()
  const supabase = createClient()

  return useQuery({
    queryKey: ['products-feed', categoryId, searchQuery, userLocation],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_products_feed', {
        user_lat: userLocation?.lat,
        user_lng: userLocation?.lng,
        p_category_id: categoryId ?? undefined,
        p_search: searchQuery || undefined,
      })
      if (error) throw error
      return data
    },
  })
}