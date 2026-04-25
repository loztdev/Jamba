import { useRef, useEffect } from 'react'
import { Send, Square, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { Chat, Character } from '../../types'

interface ChatInputProps {
  chat: Chat
  character: Character | null
  isStreaming: boolean
  onSend: (content: string) => void
  onCancel: () => void
  onOpenModelPicker: () => void
  onOpenCharacters: () => void
}

export function ChatInput({
  chat,
  character,
  isStreaming,
  onSend,
  onCancel,
  onOpenModelPicker,
  onOpenCharacters,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  })

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const val = textareaRef.current?.value.trim()
    if (!val || isStreaming) return
    if (textareaRef.current) textareaRef.current.value = ''
    onSend(val)
  }

  // Extract provider from model id like "openai/gpt-4o" → "openai"
  const modelParts = chat.modelId.split('/')
  const provider = modelParts[0] ?? ''
  const modelShort = modelParts.slice(1).join('/') || chat.modelId

  return (
    <div
      className="border-t border-subtle p-3"
      style={{ background: 'var(--bg-secondary)' }}
    >
      {/* Context bar: model + character */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <button
          onClick={onOpenModelPicker}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-subtle btn-ghost font-medium"
          title="Change model"
        >
          <span className="text-muted capitalize">{provider}</span>
          <span>/</span>
          <span>{modelShort}</span>
          <ChevronDown size={11} className="text-muted" />
        </button>

        <button
          onClick={onOpenCharacters}
          className={clsx(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-subtle btn-ghost font-medium',
            character ? 'border-accent' : ''
          )}
          style={character ? { borderColor: character.color } : undefined}
          title="Change character"
        >
          {character ? (
            <>
              <span>{character.emoji}</span>
              <span>{character.name}</span>
            </>
          ) : (
            <span className="text-muted">No Character</span>
          )}
          <ChevronDown size={11} className="text-muted" />
        </button>

        {chat.systemPrompt && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            title={chat.systemPrompt}
          >
            📋 System prompt set
          </span>
        )}
      </div>

      {/* Input row */}
      <div
        className="flex items-end gap-2 rounded-xl border border-subtle p-2"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed min-h-[1.5rem] max-h-[200px]"
          style={{ color: 'var(--text-primary)' }}
        />
        {isStreaming ? (
          <button
            onClick={onCancel}
            className="shrink-0 p-2 rounded-lg transition-colors"
            style={{ background: 'var(--danger)', color: 'white' }}
            title="Stop generation"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={submit}
            className="shrink-0 p-2 rounded-lg btn-primary"
            title="Send"
          >
            <Send size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
