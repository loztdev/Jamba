import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Check, Sparkles, Settings2 } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import clsx from 'clsx'
import type { Character } from '../../types'
import { AICharacterBuilder } from './AICharacterBuilder'

interface CharacterSelectorProps {
  onClose: () => void
  onOpenManager?: () => void
}

const EMOJI_OPTIONS = ['🌸', '💻', '✍️', '🧙', '🃏', '🔮', '🦊', '🐉', '🌙', '⚡', '🎯', '🧪', '🤖', '👾', '🦋']
const COLOR_OPTIONS = ['#bd93f9', '#50fa7b', '#ffb86c', '#8be9fd', '#ff79c6', '#ff5555', '#f1fa8c', '#268bd2', '#2aa198', '#859900']

function CharacterForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Character>
  onSave: (c: Omit<Character, 'id' | 'isBuiltIn'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🤖')
  const [color, setColor] = useState(initial?.color ?? '#bd93f9')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '')
  const tags = initial?.tags ?? []

  function handleSave() {
    if (!name.trim() || !systemPrompt.trim()) return
    onSave({
      name: name.trim(),
      emoji,
      color,
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      tags,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Emoji picker */}
        <div className="relative">
          <select
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="input-field text-2xl w-16 text-center cursor-pointer"
            style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}
          >
            {EMOJI_OPTIONS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field text-sm font-semibold flex-1"
          placeholder="Character name"
          autoFocus
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="text-xs text-muted mb-1.5 block">Accent color</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input-field text-xs"
        placeholder="Short description (optional)"
      />
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={4}
        className="input-field text-xs resize-none leading-relaxed"
        placeholder="System prompt — define this character's personality, role, and voice…"
      />
      <div className="flex gap-2">
        <button onClick={handleSave} className="btn-primary text-xs flex-1">Save Character</button>
        <button onClick={onCancel} className="btn-ghost text-xs flex-1 border border-subtle">Cancel</button>
      </div>
    </div>
  )
}

export function CharacterSelector({ onClose, onOpenManager }: CharacterSelectorProps) {
  const characters = useChatStore((s) => s.characters)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const chats = useChatStore((s) => s.chats)
  const updateChat = useChatStore((s) => s.updateChat)
  const addCharacter = useChatStore((s) => s.addCharacter)
  const updateCharacter = useChatStore((s) => s.updateCharacter)
  const deleteCharacter = useChatStore((s) => s.deleteCharacter)

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const currentCharId = activeChat?.characterId ?? null

  const [editId, setEditId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [aiDraft, setAiDraft] = useState<Partial<Character> | null>(null)
  const [showAIBuilder, setShowAIBuilder] = useState(false)
  const [punchUpId, setPunchUpId] = useState<string | null>(null)
  const punchUpTarget = punchUpId ? characters.find((c) => c.id === punchUpId) ?? null : null

  function selectCharacter(charId: string | null) {
    if (!activeChatId) { onClose(); return }
    const char = charId ? characters.find((c) => c.id === charId) : null
    updateChat(activeChatId, {
      characterId: charId,
      systemPrompt: char?.systemPrompt ?? '',
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl fade-in"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0">
          <h2 className="font-bold text-base">👤 Characters</h2>
          <div className="flex items-center gap-1">
            {onOpenManager && (
              <button
                onClick={onOpenManager}
                className="btn-ghost text-xs flex items-center gap-1.5 border border-subtle rounded-lg"
                title="Open the full Characters tab"
              >
                <Settings2 size={12} />
                <span className="hidden sm:inline">Manage</span>
              </button>
            )}
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {isCreating ? (
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                {aiDraft && <Sparkles size={14} style={{ color: 'var(--accent)' }} />}
                {aiDraft ? 'New Character (AI Draft)' : 'New Character'}
              </h3>
              <CharacterForm
                initial={aiDraft ?? undefined}
                onSave={(c) => {
                  addCharacter(c)
                  setIsCreating(false)
                  setAiDraft(null)
                }}
                onCancel={() => {
                  setIsCreating(false)
                  setAiDraft(null)
                }}
              />
            </div>
          ) : null}

          {editId ? (
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-3">Edit Character</h3>
              <CharacterForm
                initial={characters.find((c) => c.id === editId)}
                onSave={(c) => { updateCharacter(editId, c); setEditId(null) }}
                onCancel={() => setEditId(null)}
              />
            </div>
          ) : null}

          {/* No character option */}
          <button
            onClick={() => selectCharacter(null)}
            className={clsx(
              'w-full text-left p-3 rounded-xl border transition-all mb-3',
              !currentCharId && activeChatId ? 'border-accent' : 'border-subtle hover:border-accent'
            )}
            style={{
              background: !currentCharId && activeChatId
                ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-tertiary))'
                : 'var(--bg-tertiary)',
              borderColor: !currentCharId && activeChatId ? 'var(--accent)' : undefined,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚫</span>
                <div>
                  <div className="font-semibold text-sm">No Character</div>
                  <div className="text-xs text-muted">Use manual system prompt or none</div>
                </div>
              </div>
              {!currentCharId && activeChatId && (
                <Check size={14} style={{ color: 'var(--accent)' }} />
              )}
            </div>
          </button>

          {/* Character grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {characters.map((char) => (
              <div key={char.id} className="relative group">
                <button
                  onClick={() => selectCharacter(char.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-xl border transition-all',
                    currentCharId === char.id && activeChatId
                      ? 'border-accent'
                      : 'border-subtle hover:border-accent'
                  )}
                  style={{
                    background: currentCharId === char.id && activeChatId
                      ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-tertiary))'
                      : 'var(--bg-tertiary)',
                    borderColor: currentCharId === char.id && activeChatId ? 'var(--accent)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {char.avatarUrl ? (
                        <img
                          src={char.avatarUrl}
                          alt={char.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{ border: `1.5px solid ${char.color}` }}
                        />
                      ) : (
                        <span
                          className="text-2xl w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${char.color}22` }}
                        >
                          {char.emoji}
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-sm" style={{ color: char.color }}>{char.name}</div>
                        <div className="text-xs text-muted line-clamp-1">{char.description}</div>
                      </div>
                    </div>
                    {currentCharId === char.id && activeChatId && (
                      <Check size={14} style={{ color: 'var(--accent)' }} className="shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                    {char.systemPrompt}
                  </p>
                </button>

                {!char.isBuiltIn && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPunchUpId(char.id) }}
                      className="p-1 rounded-md"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                      title="AI Punch Up"
                    >
                      <Sparkles size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditId(char.id) }}
                      className="p-1 rounded-md"
                      style={{ background: 'var(--bg-secondary)' }}
                      title="Edit"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id) }}
                      className="p-1 rounded-md"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--danger)' }}
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-subtle p-3 shrink-0 flex gap-2">
          <button
            onClick={() => { setAiDraft(null); setIsCreating(true) }}
            className="btn-ghost flex items-center gap-2 flex-1 justify-center text-sm border border-subtle rounded-xl py-2 disabled:opacity-50"
            disabled={isCreating}
          >
            <Plus size={14} />
            Create Custom
          </button>
          <button
            onClick={() => setShowAIBuilder(true)}
            className="btn-primary flex items-center gap-2 flex-1 justify-center text-sm rounded-xl py-2"
            title="Use a model to draft a character for you"
          >
            <Sparkles size={14} />
            AI Build
          </button>
        </div>
      </div>

      {showAIBuilder && (
        <AICharacterBuilder
          onClose={() => setShowAIBuilder(false)}
          onAccept={(draft) => {
            setAiDraft(draft)
            setIsCreating(true)
            setEditId(null)
            setShowAIBuilder(false)
          }}
        />
      )}

      {punchUpTarget && (
        <AICharacterBuilder
          mode={{ kind: 'rewrite', existing: punchUpTarget }}
          onClose={() => setPunchUpId(null)}
          onAccept={(draft) => {
            updateCharacter(punchUpTarget.id, draft)
            setPunchUpId(null)
          }}
        />
      )}
    </div>
  )
}
