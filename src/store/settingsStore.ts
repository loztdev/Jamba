import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName, IdleAnimation, CustomThemeVars } from '../types'
import { DEFAULT_CUSTOM_THEME } from '../types'

const RECENT_CAP = 8

function applyCustomTheme(vars: CustomThemeVars) {
  const el = document.documentElement
  el.style.setProperty('--bg-primary', vars.bgPrimary)
  el.style.setProperty('--bg-secondary', vars.bgSecondary)
  el.style.setProperty('--bg-tertiary', vars.bgTertiary)
  el.style.setProperty('--text-primary', vars.textPrimary)
  el.style.setProperty('--text-secondary', vars.textSecondary)
  el.style.setProperty('--accent', vars.accent)
  el.style.setProperty('--accent-hover', vars.accent)
  el.style.setProperty('--border', vars.border)
  el.style.setProperty('--surface', vars.surface)
  el.style.setProperty('--user-bubble', vars.userBubble)
  el.style.setProperty('--danger', vars.danger)
  el.style.setProperty('--scrollbar', vars.border)
}

function clearCustomTheme() {
  const el = document.documentElement
  const props = [
    '--bg-primary', '--bg-secondary', '--bg-tertiary',
    '--text-primary', '--text-secondary', '--accent', '--accent-hover',
    '--border', '--surface', '--user-bubble', '--danger', '--scrollbar',
  ]
  props.forEach((p) => el.style.removeProperty(p))
}

interface SettingsState {
  apiKey: string
  builderApiKey: string
  theme: ThemeName
  defaultModelId: string
  favoriteModelIds: string[]
  recentModelIds: string[]
  idleAnimation: IdleAnimation
  customThemeVars: CustomThemeVars
  setApiKey: (key: string) => void
  setBuilderApiKey: (key: string) => void
  setTheme: (theme: ThemeName) => void
  setDefaultModelId: (id: string) => void
  toggleFavoriteModel: (id: string) => void
  isFavoriteModel: (id: string) => boolean
  pushRecentModel: (id: string) => void
  setIdleAnimation: (a: IdleAnimation) => void
  setCustomThemeVars: (vars: Partial<CustomThemeVars>) => void
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
      idleAnimation: 'random',
      customThemeVars: DEFAULT_CUSTOM_THEME,

      setApiKey: (key) => set({ apiKey: key }),
      setBuilderApiKey: (key) => set({ builderApiKey: key }),

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        if (theme === 'custom') {
          applyCustomTheme(get().customThemeVars)
        } else {
          clearCustomTheme()
        }
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

      setIdleAnimation: (a) => set({ idleAnimation: a }),

      setCustomThemeVars: (vars) => {
        set((s) => {
          const next = { ...s.customThemeVars, ...vars }
          if (s.theme === 'custom') applyCustomTheme(next)
          return { customThemeVars: next }
        })
      },
    }),
    {
      name: 'jamba-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'custom') {
          document.documentElement.setAttribute('data-theme', 'custom')
          applyCustomTheme(state.customThemeVars)
        }
      },
    }
  )
)
