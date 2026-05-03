import { useEffect, useRef, useState } from 'react'
import { X, Search, RefreshCw } from 'lucide-react'
import { useModelStore } from '../../store/modelStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useChatStore } from '../../store/chatStore'
import { fetchModels } from '../../api/openrouter'
import { filterAndSortModels } from '../../utils/modelFilters'
import { ModelCard } from './ModelCard'
import type { ModelCategory, ModelSortKey } from '../../types'
import clsx from 'clsx'

const CATEGORIES: { key: ModelCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: '⭐ Favorites' },
  { key: 'recent', label: '🕒 Recent' },
  { key: 'coding', label: '💻 Coding' },
  { key: 'writing', label: '✍️ Writing' },
  { key: 'roleplay', label: '🎭 Roleplay' },
  { key: 'reasoning', label: '🧠 Reasoning' },
  { key: 'uncensored', label: '🔓 Uncensored' },
  { key: 'general', label: '⚡ General' },
]

const SORT_OPTIONS: { key: ModelSortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'new', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'context-desc', label: 'Context: Large → Small' },
  { key: 'context-asc', label: 'Context: Small → Large' },
  { key: 'params-desc', label: 'Params: Large → Small' },
  { key: 'params-asc', label: 'Params: Small → Large' },
]

interface ModelPickerProps {
  onClose: () => void
  /** If provided, selecting a model updates the chat rather than the default */
  chatId?: string | null
  /** Override what happens on selection — used by AI character builder etc. */
  onSelectModel?: (modelId: string) => void
  /** Override the highlighted/current model id when onSelectModel is used */
  currentModelIdOverride?: string
  /** Optional title override */
  title?: string
}

export function ModelPicker({ onClose, chatId, onSelectModel, currentModelIdOverride, title }: ModelPickerProps) {
  const models = useModelStore((s) => s.models)
  const isLoading = useModelStore((s) => s.isLoading)
  const error = useModelStore((s) => s.error)
  const hasFetched = useModelStore((s) => s.hasFetched)
  const searchQuery = useModelStore((s) => s.searchQuery)
  const sortKey = useModelStore((s) => s.sortKey)
  const category = useModelStore((s) => s.category)
  const setModels = useModelStore((s) => s.setModels)
  const setLoading = useModelStore((s) => s.setLoading)
  const setError = useModelStore((s) => s.setError)
  const setSearchQuery = useModelStore((s) => s.setSearchQuery)
  const setSortKey = useModelStore((s) => s.setSortKey)
  const setCategory = useModelStore((s) => s.setCategory)
  const setHasFetched = useModelStore((s) => s.setHasFetched)

  const apiKey = useSettingsStore((s) => s.apiKey)
  const setDefaultModelId = useSettingsStore((s) => s.setDefaultModelId)
  const defaultModelId = useSettingsStore((s) => s.defaultModelId)
  const favoriteModelIds = useSettingsStore((s) => s.favoriteModelIds)
  const recentModelIds = useSettingsStore((s) => s.recentModelIds)

  const updateChat = useChatStore((s) => s.updateChat)
  const chats = useChatStore((s) => s.chats)
  const currentModelId = currentModelIdOverride
    ?? (chatId
      ? (chats.find((c) => c.id === chatId)?.modelId ?? defaultModelId)
      : defaultModelId)

  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localQuery, setLocalQuery] = useState(searchQuery)

  async function loadModels() {
    if (!apiKey) { setError('No API key set. Go to Settings.'); return }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchModels(apiKey)
      setModels(data)
      setHasFetched(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasFetched && apiKey) loadModels()
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 50)
    return () => clearTimeout(focusTimer)
    // Run once on mount: fetch models and focus the search box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(val), 200)
  }

  function handleSelect(modelId: string) {
    if (onSelectModel) {
      onSelectModel(modelId)
    } else if (chatId) {
      updateChat(chatId, { modelId })
    } else {
      setDefaultModelId(modelId)
    }
    onClose()
  }

  const filtered = filterAndSortModels(models, {
    searchQuery,
    sortKey,
    category,
    favoriteIds: favoriteModelIds,
    recentIds: recentModelIds,
  })

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl flex flex-col shadow-2xl fade-in rounded-none sm:rounded-2xl max-h-[100dvh] sm:max-h-[85svh]"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0">
          <h2 className="font-bold text-base truncate">{title ?? 'Select Model'}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={loadModels} className="btn-ghost p-1.5 rounded-lg" title="Refresh models">
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search + sort row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-2 border-b border-subtle shrink-0">
          <div
            className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <Search size={14} className="text-muted shrink-0" />
            <input
              ref={searchRef}
              value={localQuery}
              onChange={handleSearchChange}
              placeholder="Search models…"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as ModelSortKey)}
            className="input-field text-xs py-2 w-full sm:w-auto sm:min-w-[9rem]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-2 overflow-x-auto shrink-0 border-b border-subtle">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={clsx(
                'shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap',
                category === cat.key ? 'text-white' : 'btn-ghost'
              )}
              style={category === cat.key ? { background: 'var(--accent)' } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-muted text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" />
              Loading models…
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
              <button onClick={loadModels} className="btn-primary text-sm">Retry</button>
            </div>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="text-center text-muted text-sm py-12">
              {category === 'favorites'
                ? 'No favorites yet — tap the ⭐ on any model to pin it here.'
                : category === 'recent'
                  ? 'No recent models yet — start chatting and they’ll show up here.'
                  : 'No models match your search.'}
            </p>
          )}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  selected={model.id === currentModelId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-subtle shrink-0 text-xs text-muted text-center">
          {filtered.length} model{filtered.length !== 1 ? 's' : ''} shown
          {models.length > 0 && ` of ${models.length} total`}
        </div>
      </div>
    </div>
  )
}
