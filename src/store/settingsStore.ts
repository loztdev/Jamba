import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName } from '../types'

interface SettingsState {
  apiKey: string
  theme: ThemeName
  defaultModelId: string
  favoriteModelIds: string[]
  setApiKey: (key: string) => void
  setTheme: (theme: ThemeName) => void
  setDefaultModelId: (id: string) => void
  toggleFavoriteModel: (id: string) => void
  isFavoriteModel: (id: string) => boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      theme: 'dark',
      defaultModelId: 'openai/gpt-4o-mini',
      favoriteModelIds: [],
      setApiKey: (key) => set({ apiKey: key }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      setDefaultModelId: (id) => set({ defaultModelId: id }),
      toggleFavoriteModel: (id) =>
        set((s) => ({
          favoriteModelIds: s.favoriteModelIds.includes(id)
            ? s.favoriteModelIds.filter((m) => m !== id)
            : [...s.favoriteModelIds, id],
        })),
      isFavoriteModel: (id) => get().favoriteModelIds.includes(id),
    }),
    {
      name: 'jamba-settings',
    }
  )
)
