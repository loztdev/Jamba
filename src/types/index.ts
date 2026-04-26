export type ThemeName = 'dark' | 'amoled' | 'light' | 'dracula' | 'nord' | 'cyberpunk' | 'solarized'

export interface Model {
  id: string
  name: string
  created: number
  context_length: number
  max_completion_tokens: number | null
  pricing: {
    prompt: string
    completion: string
  }
  description?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  isStreaming?: boolean
}

export interface Chat {
  id: string
  title: string
  modelId: string
  characterId: string | null
  systemPrompt: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Character {
  id: string
  name: string
  emoji: string
  color: string
  systemPrompt: string
  tags: string[]
  description: string
  isBuiltIn?: boolean
}

export interface Prompt {
  id: string
  name: string
  content: string
  isBuiltIn?: boolean
}

export type ModelCategory =
  | 'all'
  | 'favorites'
  | 'recent'
  | 'coding'
  | 'writing'
  | 'roleplay'
  | 'reasoning'
  | 'uncensored'
  | 'general'

export type ModelSortKey =
  | 'popular'
  | 'new'
  | 'price-asc'
  | 'price-desc'
  | 'context-asc'
  | 'context-desc'
  | 'params-asc'
  | 'params-desc'

export interface ThemeSwatch {
  name: ThemeName
  label: string
  bg: string
  accent: string
}

export const THEME_SWATCHES: ThemeSwatch[] = [
  { name: 'dark', label: 'Dark', bg: '#1a1a1a', accent: '#7c6af7' },
  { name: 'amoled', label: 'AMOLED', bg: '#000000', accent: '#7c6af7' },
  { name: 'light', label: 'Light', bg: '#f5f5f5', accent: '#6b59e6' },
  { name: 'dracula', label: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
  { name: 'nord', label: 'Nord', bg: '#2e3440', accent: '#88c0d0' },
  { name: 'cyberpunk', label: 'Cyberpunk', bg: '#0d0d0d', accent: '#00ffff' },
  { name: 'solarized', label: 'Solarized', bg: '#002b36', accent: '#268bd2' },
]
