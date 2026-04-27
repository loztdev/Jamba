import { useState, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import type { Chat, TextContentPart } from '../../types'

interface SearchResult {
  chatId: string
  chatTitle: string
  snippet: string
  matchStart: number
  matchLength: number
}

function getMessageText(content: Chat['messages'][number]['content']): string {
  if (typeof content === 'string') return content
  return content
    .filter((p): p is TextContentPart => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
}

function buildResults(query: string, chats: Chat[]): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []

  for (const chat of chats) {
    if (chat.title.toLowerCase().includes(q)) {
      const idx = chat.title.toLowerCase().indexOf(q)
      results.push({
        chatId: chat.id,
        chatTitle: chat.title,
        snippet: chat.title,
        matchStart: idx,
        matchLength: q.length,
      })
    }
    for (const msg of chat.messages) {
      if (msg.role === 'system') continue
      const text = getMessageText(msg.content)
      const idx = text.toLowerCase().indexOf(q)
      if (idx === -1) continue
      const start = Math.max(0, idx - 60)
      const end = Math.min(text.length, idx + q.length + 60)
      const prefix = start > 0 ? '…' : ''
      const suffix = end < text.length ? '…' : ''
      const snippet = prefix + text.slice(start, end) + suffix
      const adjustedStart = idx - start + prefix.length
      results.push({
        chatId: chat.id,
        chatTitle: chat.title,
        snippet,
        matchStart: adjustedStart,
        matchLength: q.length,
      })
      if (results.filter((r) => r.chatId === chat.id).length >= 3) break
    }
    if (results.length >= 50) break
  }

  return results
}

function HighlightedSnippet({ snippet, matchStart, matchLength }: { snippet: string; matchStart: number; matchLength: number }) {
  const before = snippet.slice(0, matchStart)
  const match = snippet.slice(matchStart, matchStart + matchLength)
  const after = snippet.slice(matchStart + matchLength)
  return (
    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
      {before}
      <mark
        style={{
          background: 'color-mix(in srgb, var(--accent) 30%, transparent)',
          color: 'var(--text-primary)',
          borderRadius: '2px',
          padding: '0 1px',
        }}
      >
        {match}
      </mark>
      {after}
    </span>
  )
}

interface ChatSearchProps {
  onClose: () => void
}

export function ChatSearch({ onClose }: ChatSearchProps) {
  const chats = useChatStore((s) => s.chats)
  const setActiveChatId = useChatStore((s) => s.setActiveChatId)
  const [query, setQuery] = useState('')

  const results = useMemo(() => buildResults(query, chats), [query, chats])

  function handleResultClick(chatId: string) {
    setActiveChatId(chatId)
    onClose()
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
        <span className="font-semibold text-sm">Search Chats</span>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-md" title="Close">
          <X size={16} />
        </button>
      </div>

      {/* Search input */}
      <div className="px-4 py-3 border-b border-subtle shrink-0">
        <div
          className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-2"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <Search size={14} className="text-muted shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search messages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn-ghost p-0.5 rounded shrink-0">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {!query.trim() && (
          <p className="text-center text-muted text-xs px-4 py-8">
            Type to search across all your conversations
          </p>
        )}
        {query.trim() && results.length === 0 && (
          <p className="text-center text-muted text-xs px-4 py-8">No results found</p>
        )}
        {results.map((result, i) => (
          <button
            key={`${result.chatId}-${i}`}
            onClick={() => handleResultClick(result.chatId)}
            className="w-full text-left px-4 py-2.5 hover:bg-tertiary transition-colors border-b border-subtle"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs font-medium mb-0.5 truncate" style={{ color: 'var(--accent)' }}>
              {result.chatTitle}
            </p>
            <HighlightedSnippet
              snippet={result.snippet}
              matchStart={result.matchStart}
              matchLength={result.matchLength}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
