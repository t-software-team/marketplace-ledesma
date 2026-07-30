import { create } from 'zustand'

interface FiltersState {
  categoryId: string | null
  searchQuery: string
  userLocation: { lat: number; lng: number } | null
  attributeValue: string | null
  setCategory: (id: string | null) => void
  setSearch: (q: string) => void
  setLocation: (loc: { lat: number; lng: number } | null) => void
  setAttributeValue: (value: string | null) => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  categoryId: null,
  searchQuery: '',
  userLocation: null,
  attributeValue: null,
  setCategory: (id) => set({ categoryId: id, attributeValue: null }),
  setSearch: (q) => set({ searchQuery: q }),
  setLocation: (loc) => set({ userLocation: loc }),
  setAttributeValue: (value) => set({ attributeValue: value }),
}))
