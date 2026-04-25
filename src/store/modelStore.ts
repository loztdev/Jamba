import { create } from 'zustand'
import type { Model, ModelCategory, ModelSortKey } from '../types'

interface ModelState {
  models: Model[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortKey: ModelSortKey
  category: ModelCategory
  hasFetched: boolean
  setModels: (models: Model[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setSearchQuery: (q: string) => void
  setSortKey: (k: ModelSortKey) => void
  setCategory: (c: ModelCategory) => void
  setHasFetched: (v: boolean) => void
}

export const useModelStore = create<ModelState>()((set) => ({
  models: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortKey: 'popular',
  category: 'all',
  hasFetched: false,
  setModels: (models) => set({ models }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortKey: (k) => set({ sortKey: k }),
  setCategory: (c) => set({ category: c }),
  setHasFetched: (v) => set({ hasFetched: v }),
}))
