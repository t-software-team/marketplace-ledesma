import { create } from 'zustand'

interface FiltersState {
  categoryId: string | null
  searchQuery: string
  userLocation: { lat: number; lng: number } | null
  setCategory: (id: string | null) => void
  setSearch: (q: string) => void
  setLocation: (loc: { lat: number; lng: number } | null) => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  categoryId: null,
  searchQuery: '',
  userLocation: null,
  setCategory: (id) => set({ categoryId: id }),
  setSearch: (q) => set({ searchQuery: q }),
  setLocation: (loc) => set({ userLocation: loc }),
}))