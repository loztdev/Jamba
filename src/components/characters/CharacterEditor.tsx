import { useRef, useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Save, Trash2 } from 'lucide-react'
import type { Character } from '../../types'

const EMOJI_OPTIONS = ['🌸', '💻', '✍️', '🧙', '🃏', '🔮', '🦊', '🐉', '🌙', '⚡', '🎯', '🧪', '🤖', '👾', '🦋']
const COLOR_OPTIONS = ['#bd93f9', '#50fa7b', '#ffb86c', '#8be9fd', '#ff79c6', '#ff5555', '#f1fa8c', '#268bd2', '#2aa198', '#859900']

const MAX_AVATAR_BYTES = 1_500_000

export type CharacterDraft = Omit<Character, 'id' | 'isBuiltIn'>

interface CharacterEditorProps {
  initial?: Partial<Character>
  onSave: (draft: CharacterDraft) => void
  onCancel?: () => void
  onDelete?: () => void
  saveLabel?: string
  embedded?: boolean
}

export function CharacterEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
  saveLabel = 'Save Character',
  embedded,
}: CharacterEditorProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🤖')
  const [color, setColor] = useState(initial?.color ?? '#bd93f9')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '))
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initial?.avatarUrl)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(initial?.name ?? '')
    setEmoji(initial?.emoji ?? '🤖')
    setColor(initial?.color ?? '#bd93f9')
    setDescription(initial?.description ?? '')
    setSystemPrompt(initial?.systemPrompt ?? '')
    setNotes(initial?.notes ?? '')
    setTagsText((initial?.tags ?? []).join(', '))
    setAvatarUrl(initial?.avatarUrl)
    setAvatarError(null)
  }, [initial])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please pick an image file (PNG, JPG, WEBP, GIF…).')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(`Image is ${Math.round(file.size / 1024)}KB. Try one under ~1.5MB.`)
      return
    }
    setAvatarError(null)
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(reader.result as string)
    reader.onerror = () => setAvatarError('Could not read that image.')
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (!name.trim() || !systemPrompt.trim()) return
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8)
    onSave({
      name: name.trim().slice(0, 60),
      emoji,
      color,
      description: description.trim().slice(0, 240),
      systemPrompt: systemPrompt.trim(),
      notes: notes.trim() || undefined,
      tags,
      avatarUrl,
    })
  }

  return (
    <div className={embedded ? 'flex flex-col gap-4' : 'flex flex-col gap-4 max-w-2xl'}>
      {/* Avatar + name */}
      <div className="flex items-start gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors hover:border-accent"
            style={{
              borderColor: avatarUrl ? color : 'var(--border)',
              background: `${color}11`,
            }}
            title="Upload character image"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted">
                <ImageIcon size={20} />
                <span className="text-[10px]">Upload</span>
              </div>
            )}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(undefined)}
              className="text-[10px] text-muted hover:text-red-400 flex items-center gap-1"
            >
              <X size={10} />
              Clear
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="input-field text-2xl w-14 text-center cursor-pointer"
              style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}
              title="Pick fallback emoji (used when no avatar)"
            >
              {EMOJI_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-sm font-semibold flex-1"
              placeholder="Character name"
              maxLength={60}
            />
          </div>

          <div>
            <label className="text-[11px] text-muted mb-1 block">Accent color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {avatarError && (
        <div
          className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
          style={{
            background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
            color: 'var(--danger)',
          }}
        >
          <X size={12} />
          {avatarError}
        </div>
      )}

      <div>
        <label className="text-xs text-muted mb-1 block">Short description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field text-xs"
          placeholder="One-sentence hook for this character"
          maxLength={240}
        />
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Tags (comma separated)</label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="input-field text-xs"
          placeholder="roleplay, mysterious, sci-fi"
        />
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">System prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          className="input-field text-xs resize-y leading-relaxed font-mono"
          placeholder="Define this character's identity, voice, behavior, knowledge, quirks, and limits…"
        />
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">
          Notes &amp; lore <span className="opacity-60">(optional, for your reference)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="input-field text-xs resize-y leading-relaxed"
          placeholder="Markdown sheet — appearance, backstory, relationships, abilities, voice…"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || !systemPrompt.trim()}
          className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Save size={13} />
          {saveLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-xs flex-1 border border-subtle rounded-lg"
          >
            Cancel
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="btn-ghost text-xs px-3 border border-subtle rounded-lg flex items-center gap-1.5"
            style={{ color: 'var(--danger)' }}
            title="Delete character"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        <Upload size={11} className="inline mr-1 -mt-0.5" />
        Image is stored locally with the character. Keep it small (under ~1.5MB) so chat exports stay light.
      </p>
    </div>
  )
}
