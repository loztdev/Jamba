import type { Model, ModelCategory, ModelSortKey } from '../types'

const CODING_KW = ['code', 'coder', 'codex', 'starcoder', 'deepseek-coder', 'wizard-code', 'coding', 'deepseekcoder', 'codellama', 'code-llama', 'qwen-coder', 'qwencoder', 'devstral']
const WRITING_KW = ['creative', 'story', 'novelist', 'mythomax', 'claude', 'gpt-4', 'writing', 'writer', 'llama-3.3', 'gemini', 'unslop', 'rocinante']
const ROLEPLAY_KW = ['rp', 'roleplay', 'mytho', 'nous', 'pygmalion', 'stheno', 'hermes', 'noromaid', 'airoboros', 'dolphin', 'magnum', 'lumimaid', 'euryale', 'hanami', 'mythalion', 'nothingiisreal']
const REASONING_KW = ['o1', 'thinking', 'reason', 'qwq', 'r1', 'deepseek-r1', 'reasoning', 'reflection']
const UNCENSORED_KW = [
  'uncensored', 'nsfw', 'adult', 'abliterated',
  'venice', 'dolphin-mistral', 'dolphin-2', 'dolphin-3',
  'lumimaid', 'euryale', 'hanami', 'stheno',
  'magnum', 'rocinante', 'unslop', 'unslopnemo',
  'cydonia', 'valkyrie', 'skyfall', 'behemoth',
  'mlewd', 'mythomax', 'mythalion', 'noromaid', 'pygmalion',
  'thedrummer', 'sao10k', 'anthracite', 'neversleep', 'nothingiisreal',
  'cognitivecomputations', 'wizardlm-uncensored',
]

const VISION_KW = ['vision', 'gpt-4o', 'gpt-4-turbo', 'claude-3', 'gemini', 'pixtral', 'llava', 'qwen-vl', 'qvq', 'mistral-medium', 'mistral-large', 'mistral-small']

export function supportsVision(modelId: string): boolean {
  const lower = modelId.toLowerCase()
  return VISION_KW.some((k) => lower.includes(k))
}

export function detectCategory(model: Model): ModelCategory {
  const haystack = (model.id + ' ' + model.name).toLowerCase()
  if (UNCENSORED_KW.some((k) => haystack.includes(k))) return 'uncensored'
  if (REASONING_KW.some((k) => haystack.includes(k))) return 'reasoning'
  if (CODING_KW.some((k) => haystack.includes(k))) return 'coding'
  if (ROLEPLAY_KW.some((k) => haystack.includes(k))) return 'roleplay'
  if (WRITING_KW.some((k) => haystack.includes(k))) return 'writing'
  return 'general'
}

export function extractParamsBillions(model: Model): number {
  const haystack = model.id + ' ' + model.name
  const match = haystack.match(/(\d+\.?\d*)\s*[Bb](?:\b|[^a-zA-Z]|$)/)
  return match ? parseFloat(match[1]) : 0
}

export function formatContextLength(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function formatPrice(priceStr: string): string {
  const price = parseFloat(priceStr)
  if (!price || price === 0) return 'Free'
  const perMillion = price * 1_000_000
  if (perMillion < 0.01) return `$${(perMillion * 100).toFixed(2)}¢/1M`
  return `$${perMillion.toFixed(2)}/1M`
}

export interface FilterOptions {
  searchQuery: string
  sortKey: ModelSortKey
  category: ModelCategory
  favoriteIds?: string[]
  recentIds?: string[]
}

export function filterAndSortModels(models: Model[], opts: FilterOptions): Model[] {
  const { searchQuery, sortKey, category, favoriteIds, recentIds } = opts
  const q = searchQuery.toLowerCase().trim()
  const favSet = new Set(favoriteIds ?? [])
  const recentList = recentIds ?? []
  const recentIndex = new Map(recentList.map((id, i) => [id, i] as const))

  let filtered = models.filter((m) => {
    if (q && !m.id.toLowerCase().includes(q) && !m.name.toLowerCase().includes(q)) {
      return false
    }
    if (category === 'favorites') {
      if (!favSet.has(m.id)) return false
    } else if (category === 'recent') {
      if (!recentIndex.has(m.id)) return false
    } else if (category !== 'all') {
      if (detectCategory(m) !== category) return false
    }
    return true
  })

  // Recent tab preserves usage order regardless of selected sortKey
  if (category === 'recent') {
    return [...filtered].sort(
      (a, b) => (recentIndex.get(a.id) ?? 0) - (recentIndex.get(b.id) ?? 0)
    )
  }

  filtered = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'popular':
      case 'new':
        return b.created - a.created
      case 'price-asc':
        return parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt)
      case 'price-desc':
        return parseFloat(b.pricing.prompt) - parseFloat(a.pricing.prompt)
      case 'context-asc':
        return a.context_length - b.context_length
      case 'context-desc':
        return b.context_length - a.context_length
      case 'params-asc':
        return extractParamsBillions(a) - extractParamsBillions(b)
      case 'params-desc':
        return extractParamsBillions(b) - extractParamsBillions(a)
      default:
        return 0
    }
  })

  return filtered
}
