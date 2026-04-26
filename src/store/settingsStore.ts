import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName } from '../types'

const RECENT_CAP = 8

interface SettingsState {
  apiKey: string
  builderApiKey: string
  theme: ThemeName
  defaultModelId: string
  favoriteModelIds: string[]
  recentModelIds: string[]
  setApiKey: (key: string) => void
  setBuilderApiKey: (key: string) => void
  setTheme: (theme: ThemeName) => void
  setDefaultModelId: (id: string) => void
  toggleFavoriteModel: (id: string) => void
  isFavoriteModel: (id: string) => boolean
  pushRecentModel: (id: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      builderApiKey: '',
      theme: 'dark',
      defaultModelId: 'openai/gpt-4o-mini',
      favoriteModelIds: [],
      recentModelIds: [],
      setApiKey: (key) => set({ apiKey: key }),
      setBuilderApiKey: (key) => set({ builderApiKey: key }),
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
      pushRecentModel: (id) =>
        set((s) => ({
          recentModelIds: [id, ...s.recentModelIds.filter((m) => m !== id)].slice(0, RECENT_CAP),
        })),
    }),
    {
      name: 'jamba-settings',
    }
  )
)
