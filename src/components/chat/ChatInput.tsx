import { useRef, useEffect, useState } from 'react'
import { Send, Square, ChevronDown, Paperclip, X, FileText, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import type { Chat, Character, Attachment } from '../../types'
import { readFileAsAttachment } from '../../utils/attachments'

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2MB

interface ChatInputProps {
  chat: Chat
  character: Character | null
  isStreaming: boolean
  supportsVision: boolean
  onSend: (content: string, attachments: Attachment[]) => void
  onCancel: () => void
  onOpenModelPicker: () => void
  onOpenCharacters: () => void
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove: () => void
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-subtle"
      style={{ background: 'var(--bg-secondary)' }}
    >
      {attachment.type === 'image' ? (
        <img src={attachment.content} alt={attachment.name} className="w-6 h-6 rounded object-cover shrink-0" />
      ) : (
        <FileText size={12} className="shrink-0 text-muted" />
      )}
      <span className="truncate max-w-[120px]">{attachment.name}</span>
      <button
        onClick={onRemove}
        className="shrink-0 p-0.5 rounded btn-ghost"
        title="Remove attachment"
      >
        <X size={11} />
      </button>
    </div>
  )
}

export function ChatInput({
  chat,
  character,
  isStreaming,
  supportsVision,
  onSend,
  onCancel,
  onOpenModelPicker,
  onOpenCharacters,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

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
    const val = textareaRef.current?.value.trim() ?? ''
    if (!val && attachments.length === 0) return
    if (isStreaming) return
    if (textareaRef.current) textareaRef.current.value = ''
    onSend(val, attachments)
    setAttachments([])
    setFileError(null)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []) as File[]
    e.target.value = ''
    setFileError(null)

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`"${file.name}" exceeds 2MB limit`)
        continue
      }
      if (file.type.startsWith('image/') && !supportsVision) {
        setFileError('This model does not support image attachments')
        continue
      }
      try {
        const attachment = await readFileAsAttachment(file)
        setAttachments((prev) => [...prev, attachment])
      } catch {
        setFileError(`Failed to read "${file.name}"`)
      }
    }
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

      {/* File error */}
      {fileError && (
        <div className="flex items-center gap-1.5 text-xs mb-2 text-red-400">
          <AlertCircle size={12} />
          <span>{fileError}</span>
        </div>
      )}

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((a) => (
            <AttachmentChip
              key={a.id}
              attachment={a}
              onRemove={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
            />
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-2 rounded-xl border border-subtle p-2"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-2 btn-ghost rounded-lg"
          title="Attach file"
          disabled={isStreaming}
        >
          <Paperclip size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.pdf,.txt,.md,.csv"
          onChange={handleFileChange}
        />
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
