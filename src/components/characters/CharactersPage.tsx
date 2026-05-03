import { useMemo, useState } from 'react'
import {
  Users, Plus, ScrollText, Sparkles, Search, MessageSquarePlus, Edit2, Trash2,
  Lock, Check, X, ArrowLeft, Wand2,
} from 'lucide-react'
import clsx from 'clsx'
import { useChatStore } from '../../store/chatStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { Character } from '../../types'
import { CharacterEditor } from './CharacterEditor'
import { CharacterTranscriber } from './CharacterTranscriber'
import { AICharacterBuilder } from './AICharacterBuilder'

type Tab = 'library' | 'create' | 'transcribe' | 'idea'

interface CharactersPageProps {
  onBackToChat: () => void
}

export function CharactersPage({ onBackToChat }: CharactersPageProps) {
  const characters = useChatStore((s) => s.characters)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const chats = useChatStore((s) => s.chats)
  const updateChat = useChatStore((s) => s.updateChat)
  const createChat = useChatStore((s) => s.createChat)
  const setActiveChatId = useChatStore((s) => s.setActiveChatId)
  const addCharacter = useChatStore((s) => s.addCharacter)
  const updateCharacter = useChatStore((s) => s.updateCharacter)
  const deleteCharacter = useChatStore((s) => s.deleteCharacter)
  const defaultModelId = useSettingsStore((s) => s.defaultModelId)
  const apiKey = useSettingsStore((s) => s.apiKey)

  const [tab, setTab] = useState<Tab>('library')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creatingFromDraft, setCreatingFromDraft] = useState<Partial<Character> | null>(null)
  const [punchUpId, setPunchUpId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const punchUpTarget = punchUpId ? characters.find((c) => c.id === punchUpId) ?? null : null
  const editingTarget = editingId ? characters.find((c) => c.id === editingId) ?? null : null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [characters, search])

  function useInChat(char: Character) {
    if (activeChat) {
      updateChat(activeChat.id, { characterId: char.id, systemPrompt: char.systemPrompt })
      onBackToChat()
      return
    }
    if (!apiKey) {
      // Still create the chat — the chat view will prompt for the key on send.
    }
    const id = createChat(defaultModelId)
    updateChat(id, { characterId: char.id, systemPrompt: char.systemPrompt })
    setActiveChatId(id)
    onBackToChat()
  }

  function startNewChatWith(char: Character) {
    const id = createChat(defaultModelId)
    updateChat(id, { characterId: char.id, systemPrompt: char.systemPrompt })
    setActiveChatId(id)
    onBackToChat()
  }

  function handleCreateSave(draft: Omit<Character, 'id' | 'isBuiltIn'>) {
    addCharacter(draft)
    setCreatingFromDraft(null)
    setTab('library')
  }

  function handleEditSave(draft: Omit<Character, 'id' | 'isBuiltIn'>) {
    if (!editingId) return
    updateCharacter(editingId, draft)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      deleteCharacter(id)
      setConfirmDeleteId(null)
      if (editingId === id) setEditingId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 2500)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 app-bg">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToChat}
            className="btn-ghost p-1.5 rounded-lg flex items-center gap-1.5"
            title="Back to chat"
          >
            <ArrowLeft size={15} />
          </button>
          <Users size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-base">Characters</h2>
          <span className="text-xs text-muted hidden sm:inline">
            ({characters.length})
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-xl border border-subtle"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <TabButton active={tab === 'library'} onClick={() => setTab('library')} icon={<Users size={13} />}>
            Library
          </TabButton>
          <TabButton active={tab === 'create'} onClick={() => { setCreatingFromDraft(null); setTab('create') }} icon={<Plus size={13} />}>
            Create
          </TabButton>
          <TabButton active={tab === 'transcribe'} onClick={() => setTab('transcribe')} icon={<ScrollText size={13} />}>
            Transcribe
          </TabButton>
          <TabButton active={tab === 'idea'} onClick={() => setTab('idea')} icon={<Sparkles size={13} />}>
            AI Idea
          </TabButton>
        </nav>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {tab === 'library' && (
          <LibraryView
            characters={filtered}
            search={search}
            onSearchChange={setSearch}
            activeCharacterId={activeChat?.characterId ?? null}
            hasActiveChat={!!activeChat}
            onUseInChat={useInChat}
            onStartNewChat={startNewChatWith}
            onEdit={(id) => setEditingId(id)}
            onPunchUp={(id) => setPunchUpId(id)}
            onDelete={handleDelete}
            confirmDeleteId={confirmDeleteId}
            onClearActive={() => {
              if (activeChat) {
                updateChat(activeChat.id, { characterId: null, systemPrompt: '' })
                onBackToChat()
              }
            }}
          />
        )}

        {tab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Plus size={14} />
              {creatingFromDraft ? 'Create — AI draft loaded' : 'Create a character from scratch'}
            </h3>
            <CharacterEditor
              initial={creatingFromDraft ?? undefined}
              onSave={handleCreateSave}
              onCancel={() => { setCreatingFromDraft(null); setTab('library') }}
              saveLabel="Add to Library"
            />
          </div>
        )}

        {tab === 'transcribe' && (
          <div className="max-w-3xl mx-auto">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ScrollText size={14} />
              Transcribe a character from source material
            </h3>
            <CharacterTranscriber
              onAccept={(draft) => {
                setCreatingFromDraft(draft)
                setTab('create')
              }}
              onCancel={() => setTab('library')}
            />
          </div>
        )}

        {tab === 'idea' && (
          <div className="max-w-2xl mx-auto">
            <IdeaPanel
              onDraft={(draft) => {
                setCreatingFromDraft(draft)
                setTab('create')
              }}
            />
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingId(null) }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl fade-in"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 size={14} />
                Edit Character
                {editingTarget.isBuiltIn && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-muted flex items-center gap-1"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <Lock size={9} /> Built-in
                  </span>
                )}
              </h3>
              <button onClick={() => setEditingId(null)} className="btn-ghost p-1.5 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {editingTarget.isBuiltIn ? (
                <div className="text-xs text-muted mb-3 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  Built-in characters are read-only. Use “Punch Up” to fork a customized copy, or copy the
                  fields into a new Create.
                </div>
              ) : null}
              {!editingTarget.isBuiltIn && (
                <CharacterEditor
                  initial={editingTarget}
                  onSave={handleEditSave}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(editingTarget.id)}
                  saveLabel="Save Changes"
                  embedded
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Punch up */}
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

function TabButton({
  active, onClick, icon, children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
        active ? 'text-white' : 'text-muted hover:text-primary'
      )}
      style={active ? { background: 'var(--accent)', color: 'white' } : undefined}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  )
}

interface LibraryViewProps {
  characters: Character[]
  search: string
  onSearchChange: (q: string) => void
  activeCharacterId: string | null
  hasActiveChat: boolean
  onUseInChat: (char: Character) => void
  onStartNewChat: (char: Character) => void
  onEdit: (id: string) => void
  onPunchUp: (id: string) => void
  onDelete: (id: string) => void
  confirmDeleteId: string | null
  onClearActive: () => void
}

function LibraryView({
  characters, search, onSearchChange,
  activeCharacterId, hasActiveChat,
  onUseInChat, onStartNewChat, onEdit, onPunchUp, onDelete, confirmDeleteId, onClearActive,
}: LibraryViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-subtle flex-1 min-w-[200px]"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <Search size={13} className="text-muted shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, description, or tag…"
            className="bg-transparent outline-none text-sm flex-1 min-w-0"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        {hasActiveChat && activeCharacterId && (
          <button
            onClick={onClearActive}
            className="btn-ghost text-xs border border-subtle rounded-lg flex items-center gap-1.5"
          >
            <X size={12} />
            Clear from current chat
          </button>
        )}
      </div>

      {characters.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No characters match. Try a different search, or create one!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            isActive={activeCharacterId === char.id}
            hasActiveChat={hasActiveChat}
            confirmDelete={confirmDeleteId === char.id}
            onUseInChat={() => onUseInChat(char)}
            onStartNewChat={() => onStartNewChat(char)}
            onEdit={() => onEdit(char.id)}
            onPunchUp={() => onPunchUp(char.id)}
            onDelete={() => onDelete(char.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface CharacterCardProps {
  character: Character
  isActive: boolean
  hasActiveChat: boolean
  confirmDelete: boolean
  onUseInChat: () => void
  onStartNewChat: () => void
  onEdit: () => void
  onPunchUp: () => void
  onDelete: () => void
}

function CharacterCard({
  character: char, isActive, hasActiveChat, confirmDelete,
  onUseInChat, onStartNewChat, onEdit, onPunchUp, onDelete,
}: CharacterCardProps) {
  return (
    <div
      className="relative rounded-2xl border p-4 flex flex-col gap-3 transition-all"
      style={{
        borderColor: isActive ? char.color : 'var(--border)',
        background: isActive
          ? `color-mix(in srgb, ${char.color} 8%, var(--bg-secondary))`
          : 'var(--bg-secondary)',
      }}
    >
      {isActive && (
        <span
          className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
          style={{ background: char.color, color: 'white' }}
        >
          <Check size={10} />
          Active
        </span>
      )}

      <div className="flex items-start gap-3">
        {char.avatarUrl ? (
          <img
            src={char.avatarUrl}
            alt={char.name}
            className="w-14 h-14 rounded-2xl object-cover shrink-0"
            style={{ border: `2px solid ${char.color}` }}
          />
        ) : (
          <span
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: `${char.color}22` }}
          >
            {char.emoji}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate" style={{ color: char.color }}>{char.name}</div>
          <div className="text-xs text-muted line-clamp-2 mt-0.5">{char.description}</div>
          {char.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {char.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={onUseInChat}
          className="btn-primary text-xs flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg"
          title={hasActiveChat ? 'Use in current chat' : 'Start a chat with this character'}
        >
          <Check size={12} />
          {hasActiveChat ? 'Use Here' : 'Start Chat'}
        </button>
        {hasActiveChat && (
          <button
            onClick={onStartNewChat}
            className="btn-ghost text-xs border border-subtle rounded-lg p-1.5"
            title="Start a brand-new chat with this character"
          >
            <MessageSquarePlus size={12} />
          </button>
        )}
        {!char.isBuiltIn && (
          <>
            <button
              onClick={onPunchUp}
              className="btn-ghost text-xs border border-subtle rounded-lg p-1.5"
              title="AI punch up"
              style={{ color: 'var(--accent)' }}
            >
              <Wand2 size={12} />
            </button>
            <button
              onClick={onEdit}
              className="btn-ghost text-xs border border-subtle rounded-lg p-1.5"
              title="Edit"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="btn-ghost text-xs border border-subtle rounded-lg p-1.5"
              style={{ color: confirmDelete ? 'var(--danger)' : undefined }}
              title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
        {char.isBuiltIn && (
          <span
            className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 text-muted"
            style={{ background: 'var(--bg-tertiary)' }}
            title="Built-in characters can't be edited, but you can fork them"
          >
            <Lock size={10} />
            Built-in
          </span>
        )}
      </div>
    </div>
  )
}

function IdeaPanel({ onDraft }: { onDraft: (draft: Partial<Character>) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Sparkles size={14} style={{ color: 'var(--accent)' }} />
        Spin one up from a single idea
      </h3>
      <p className="text-xs text-muted mb-4 leading-relaxed">
        Got a one-liner brief but no source material? Use the idea-based AI builder. It’ll invent personality,
        voice, and quirks for you. (For uploading existing source material, use the Transcribe tab.)
      </p>
      {open ? (
        <AICharacterBuilder
          onClose={() => setOpen(false)}
          onAccept={(draft) => onDraft(draft)}
        />
      ) : (
        <button onClick={() => setOpen(true)} className="btn-primary text-sm flex items-center gap-2">
          <Sparkles size={14} />
          Open AI Idea Builder
        </button>
      )}
    </>
  )
}
