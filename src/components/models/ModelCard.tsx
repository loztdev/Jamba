import { Check, Star } from 'lucide-react'
import clsx from 'clsx'
import { formatContextLength, formatPrice } from '../../utils/modelFilters'
import { useSettingsStore } from '../../store/settingsStore'
import type { Model } from '../../types'

interface ModelCardProps {
  model: Model
  selected: boolean
  onSelect: (id: string) => void
}

export function ModelCard({ model, selected, onSelect }: ModelCardProps) {
  const provider = model.id.split('/')[0] ?? ''
  const modelName = model.id.split('/').slice(1).join('/') || model.id
  const isFree = parseFloat(model.pricing.prompt) === 0

  const favoriteIds = useSettingsStore((s) => s.favoriteModelIds)
  const toggleFavorite = useSettingsStore((s) => s.toggleFavoriteModel)
  const isFavorite = favoriteIds.includes(model.id)

  return (
    <button
      onClick={() => onSelect(model.id)}
      className={clsx(
        'w-full text-left p-3 rounded-xl border transition-all',
        selected ? 'border-accent' : 'border-subtle hover:border-accent'
      )}
      style={{
        background: selected ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-tertiary))' : 'var(--bg-tertiary)',
        borderColor: selected ? 'var(--accent)' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{model.name}</span>
            {isFree && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                style={{ background: 'color-mix(in srgb, #22c55e 20%, transparent)', color: '#22c55e' }}
              >
                Free
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted capitalize">{provider}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs font-mono text-muted truncate">{modelName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <span
            role="button"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(model.id)
            }}
            className="p-1 rounded-md transition-transform hover:scale-110 cursor-pointer"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{ color: isFavorite ? '#fbbf24' : 'var(--text-secondary)' }}
          >
            <Star size={14} fill={isFavorite ? '#fbbf24' : 'none'} />
          </span>
          {selected && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <Check size={11} color="white" />
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
        <span title="Context window">
          🔤 {formatContextLength(model.context_length)}
        </span>
        <span title="Input price per 1M tokens">
          💰 {formatPrice(model.pricing.prompt)}
        </span>
        {model.max_completion_tokens && (
          <span title="Max output tokens">
            📤 {formatContextLength(model.max_completion_tokens)} out
          </span>
        )}
      </div>
    </button>
  )
}
