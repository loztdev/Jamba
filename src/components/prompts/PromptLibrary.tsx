import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Check, Lock } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import clsx from 'clsx'

interface PromptLibraryProps {
  onClose: () => void
}

export function PromptLibrary({ onClose }: PromptLibraryProps) {
  const prompts = useChatStore((s) => s.prompts)
  const addPrompt = useChatStore((s) => s.addPrompt)
  const updatePrompt = useChatStore((s) => s.updatePrompt)
  const deletePrompt = useChatStore((s) => s.deletePrompt)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const updateChat = useChatStore((s) => s.updateChat)

  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [appliedId, setAppliedId] = useState<string | null>(null)

  function handleApply(content: string, id: string) {
    if (activeChatId) {
      updateChat(activeChatId, { systemPrompt: content })
      setAppliedId(id)
      setTimeout(() => setAppliedId(null), 1500)
    }
  }

  function startEdit(p: { id: string; name: string; content: string }) {
    setEditId(p.id)
    setEditName(p.name)
    setEditContent(p.content)
  }

  function saveEdit() {
    if (!editId) return
    updatePrompt(editId, { name: editName.trim(), content: editContent.trim() })
    setEditId(null)
  }

  function handleCreate() {
    if (!newName.trim() || !newContent.trim()) return
    addPrompt({ name: newName.trim(), content: newContent.trim() })
    setNewName('')
    setNewContent('')
    setIsCreating(false)
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-full max-w-sm flex flex-col shadow-2xl"
      style={{
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        animation: 'slideInRight 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle shrink-0">
        <h2 className="font-bold text-base">📋 Prompt Library</h2>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
          <X size={16} />
        </button>
      </div>

      {!activeChatId && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs text-muted"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          Open a chat to apply prompts.
        </div>
      )}

      {/* Prompt list */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0 flex flex-col gap-2">
        {prompts.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-subtle p-3 flex flex-col gap-2"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            {editId === p.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field text-sm font-semibold"
                  placeholder="Prompt name"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="input-field text-xs resize-none leading-relaxed"
                  placeholder="System prompt content…"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="btn-primary text-xs flex-1">Save</button>
                  <button onClick={() => setEditId(null)} className="btn-ghost text-xs flex-1 border border-subtle">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {p.isBuiltIn && <Lock size={11} className="text-muted shrink-0" />}
                  <span className="font-semibold text-sm flex-1">{p.name}</span>
                </div>
                <p className="text-xs text-muted line-clamp-3 leading-relaxed">{p.content}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleApply(p.content, p.id)}
                    className={clsx(
                      'flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg flex-1 justify-center font-medium transition-all',
                      appliedId === p.id
                        ? 'text-white'
                        : 'btn-ghost border border-subtle'
                    )}
                    style={appliedId === p.id ? { background: 'var(--accent)' } : undefined}
                    disabled={!activeChatId}
                  >
                    {appliedId === p.id ? <><Check size={12} /> Applied</> : 'Apply'}
                  </button>
                  {!p.isBuiltIn && (
                    <>
                      <button
                        onClick={() => startEdit(p)}
                        className="btn-ghost p-1.5 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deletePrompt(p.id)}
                        className="btn-ghost p-1.5 rounded-lg"
                        title="Delete"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Create new prompt */}
      <div className="border-t border-subtle p-3 shrink-0">
        {isCreating ? (
          <div className="flex flex-col gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field text-sm"
              placeholder="Prompt name"
              autoFocus
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="input-field text-xs resize-none"
              placeholder="System prompt content…"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-primary text-xs flex-1">Create</button>
              <button
                onClick={() => { setIsCreating(false); setNewName(''); setNewContent('') }}
                className="btn-ghost text-xs flex-1 border border-subtle"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-ghost flex items-center gap-2 w-full justify-center text-sm border border-subtle rounded-xl py-2"
          >
            <Plus size={14} />
            New Prompt
          </button>
        )}
      </div>
    </div>
  )
}
