import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFiltersStore } from '@/stores/use-filters-store'

const FEED_PAGE_SIZE = 20
const SHOP_PRODUCTS_PAGE_SIZE = 24

export function useShopProductsPaged(shopId: string, searchQuery = '') {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['shop-products', shopId, searchQuery],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('products')
        .select('id, name, price, currency, product_images ( url, sort_order )')
        .eq('shop_id', shopId)
        .eq('is_active', true)

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + SHOP_PRODUCTS_PAGE_SIZE - 1)

      if (error) throw error

      return (data ?? []).map((product) => {
        const images = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          mainImage: images[0]?.url ?? null,
        }
      })
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < SHOP_PRODUCTS_PAGE_SIZE ? undefined : allPages.length * SHOP_PRODUCTS_PAGE_SIZE,
  })
}

export function useProductsFeed() {
  const { categoryId, searchQuery, userLocation, attributeValue } = useFiltersStore()
  const supabase = createClient()
  const seedRef = useRef<string | null>(null)
  if (seedRef.current === null) {
    seedRef.current = crypto.randomUUID()
  }

  return useInfiniteQuery({
    queryKey: ['products-feed', categoryId, searchQuery, userLocation, attributeValue],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_products_feed', {
        user_lat: userLocation?.lat,
        user_lng: userLocation?.lng,
        p_category_id: categoryId ?? undefined,
        p_search: searchQuery || undefined,
        p_seed: seedRef.current ?? undefined,
        p_attribute_value: attributeValue ?? undefined,
        p_limit: FEED_PAGE_SIZE,
        p_offset: pageParam,
      })
      if (error) throw error
      return data ?? []
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < FEED_PAGE_SIZE ? undefined : allPages.length * FEED_PAGE_SIZE,
  })
}

export function useCategoryAttributes(categoryId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['category-attributes', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_attributes')
        .select('id, key, label, type, options')
        .eq('category_id', categoryId as string)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: Boolean(categoryId),
  })
}

export interface ShopSearchResult {
  id: string
  name: string
  slug: string
  logo_url: string | null
  city: string | null
  verification_status: string
  subscription_status: string
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
        .select('id, name, slug, logo_url, city, verification_status, subscription_status')
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