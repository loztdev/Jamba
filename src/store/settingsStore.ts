import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName } from '../types'

interface SettingsState {
  apiKey: string
  theme: ThemeName
  defaultModelId: string
  setApiKey: (key: string) => void
  setTheme: (theme: ThemeName) => void
  setDefaultModelId: (id: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      theme: 'dark',
      defaultModelId: 'openai/gpt-4o-mini',
      setApiKey: (key) => set({ apiKey: key }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      setDefaultModelId: (id) => set({ defaultModelId: id }),
    }),
    {
      name: 'jamba-settings',
    }
  )
)
