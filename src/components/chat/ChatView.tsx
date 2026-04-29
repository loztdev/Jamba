import { useEffect, useRef, useState, useCallback } from 'react'
import { BookOpen, Users, Sparkles } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useStreamingChat } from '../../hooks/useStreamingChat'
import { Message } from './Message'
import { ChatInput } from './ChatInput'
import type { Character } from '../../types'

interface ChatViewProps {
  onOpenModelPicker: () => void
  onOpenPrompts: () => void
  onOpenCharacters: () => void
  onNeedApiKey: () => void
}

export function ChatView({
  onOpenModelPicker,
  onOpenPrompts,
  onOpenCharacters,
  onNeedApiKey,
}: ChatViewProps) {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const characters = useChatStore((s) => s.characters)
  const createChat = useChatStore((s) => s.createChat)
  const toggleBookmarkMessage = useChatStore((s) => s.toggleBookmarkMessage)
  const branchChat = useChatStore((s) => s.branchChat)
  const defaultModelId = useChatStore(() => {
    const stored = localStorage.getItem('jamba-settings')
    if (stored) {
      try {
        return JSON.parse(stored).state?.defaultModelId ?? 'openai/gpt-4o-mini'
      } catch {
        return 'openai/gpt-4o-mini'
      }
    }
    return 'openai/gpt-4o-mini'
  })

  const { sendMessage, regenerate, editAndResend, isStreaming, cancelStream } = useStreamingChat()

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const character: Character | null = activeChat?.characterId
    ? (characters.find((c) => c.id === activeChat.characterId) ?? null)
    : null

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setIsAtBottom(atBottom)
  }, [])

  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeChat?.messages.length, activeChat?.messages[activeChat.messages.length - 1]?.content, isAtBottom])

  function handleSend(content: string, imageUrl?: string) {
    const apiKey = (() => {
      const stored = localStorage.getItem('jamba-settings')
      if (stored) {
        try { return JSON.parse(stored).state?.apiKey ?? '' } catch { return '' }
      }
      return ''
    })()

    if (!apiKey) {
      onNeedApiKey()
      return
    }

    let chatId = activeChatId
    if (!chatId) {
      chatId = createChat(defaultModelId)
    }
    sendMessage(chatId, content, imageUrl)
  }

  function handleRegenerate() {
    if (activeChatId) regenerate(activeChatId)
  }

  function handleEdit(messageId: string, newContent: string) {
    if (activeChatId) editAndResend(activeChatId, messageId, newContent)
  }

  function handleBranch(messageId: string) {
    if (activeChatId) branchChat(activeChatId, messageId)
  }

  // Empty state
  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 app-bg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 accent-text">OpenStarChat</h1>
          <p className="text-muted text-sm">Your OpenRouter chat interface</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <ActionCard
            icon={<Sparkles size={18} />}
            title="New Chat"
            description="Start a fresh conversation"
            onClick={() => {
              const apiKey = (() => {
                const stored = localStorage.getItem('jamba-settings')
                if (stored) {
                  try { return JSON.parse(stored).state?.apiKey ?? '' } catch { return '' }
                }
                return ''
              })()
              if (!apiKey) { onNeedApiKey(); return }
              createChat(defaultModelId)
            }}
          />
          <ActionCard
            icon={<Users size={18} />}
            title="Characters"
            description="Choose a persona for the AI"
            onClick={onOpenCharacters}
          />
          <ActionCard
            icon={<BookOpen size={18} />}
            title="Prompts"
            description="Browse & apply system prompts"
            onClick={onOpenPrompts}
          />
        </div>
      </div>
    )
  }

  const visibleMessages = activeChat.messages.filter((m) => m.role !== 'system')

  return (
    <div className="flex-1 flex flex-col min-h-0 app-bg">
      {/* Chat header */}
      <header
        className="flex items-center justify-between px-4 py-2.5 border-b border-subtle shrink-0"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {character && (
            <span className="text-lg" title={character.name}>
              {character.emoji}
            </span>
          )}
          <h2 className="font-semibold text-sm truncate">{activeChat.title}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenPrompts}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
            title="Prompt Library"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Prompts</span>
          </button>
          <button
            onClick={onOpenCharacters}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
            title="Characters"
          >
            <Users size={14} />
            <span className="hidden sm:inline">Characters</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 py-2"
      >
        {visibleMessages.map((msg, idx) => (
          <Message
            key={msg.id}
            message={msg}
            chatId={activeChat.id}
            isLast={idx === visibleMessages.length - 1}
            isStreaming={isStreaming}
            onBookmark={(msgId) => toggleBookmarkMessage(activeChat.id, msgId)}
            onEdit={handleEdit}
            onRegenerate={handleRegenerate}
            onBranch={handleBranch}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        chat={activeChat}
        character={character}
        isStreaming={isStreaming}
        onSend={handleSend}
        onCancel={cancelStream}
        onOpenModelPicker={onOpenModelPicker}
        onOpenCharacters={onOpenCharacters}
      />
    </div>
  )
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1.5 p-4 rounded-xl border border-subtle text-left transition-all hover:border-accent w-48"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <span className="accent-text">{icon}</span>
      <span className="font-semibold text-sm">{title}</span>
      <span className="text-muted text-xs">{description}</span>
    </button>
  )
}
