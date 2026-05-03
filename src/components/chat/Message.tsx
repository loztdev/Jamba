import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Bookmark, BookmarkCheck, Edit2, RefreshCw, GitBranch, X } from 'lucide-react'
import clsx from 'clsx'
import type { Message as MessageType, Character } from '../../types'

interface MessageProps {
  message: MessageType
  chatId: string
  character?: Character | null
  isLast?: boolean
  isStreaming?: boolean
  onBookmark: (messageId: string) => void
  onEdit: (messageId: string, newContent: string) => void
  onRegenerate: () => void
  onBranch: (messageId: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity btn-ghost"
      title="Copy message"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

function estimateCost(tokenCount: number): string | null {
  if (!tokenCount) return null
  return `~${tokenCount} tokens`
}

export function Message({
  message,
  chatId: _chatId,
  character,
  isLast,
  isStreaming,
  onBookmark,
  onEdit,
  onRegenerate,
  onBranch,
}: MessageProps) {
  const isUser = message.role === 'user'
  const showCharAvatar = !isUser && !!character
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(message.content)

  function submitEdit() {
    const trimmed = editDraft.trim()
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setEditDraft(message.content)
    setEditing(false)
  }

  return (
    <div
      className={clsx(
        'flex gap-3 px-4 py-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showCharAvatar && character ? (
        character.avatarUrl ? (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="shrink-0 w-7 h-7 rounded-full object-cover mt-0.5"
            style={{ border: `1.5px solid ${character.color}` }}
            title={character.name}
          />
        ) : (
          <div
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-base mt-0.5"
            style={{ background: `${character.color}22` }}
            title={character.name}
          >
            {character.emoji}
          </div>
        )
      ) : (
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
          style={
            isUser
              ? { background: 'var(--accent)', color: 'white' }
              : { background: 'var(--surface)', color: 'var(--text-secondary)' }
          }
        >
          {isUser ? 'U' : 'AI'}
        </div>
      )}

      {/* Bubble */}
      <div className={clsx('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative"
          style={{
            background: isUser ? 'var(--user-bubble)' : 'var(--surface)',
            borderRadius: isUser ? '1rem 0.25rem 1rem 1rem' : '0.25rem 1rem 1rem 1rem',
          }}
        >
          {/* Attached image */}
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Attached"
              className="max-w-xs max-h-48 rounded-lg mb-2 object-contain"
            />
          )}

          {editing && isUser ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="bg-transparent outline-none resize-none text-sm leading-relaxed w-full min-h-[3rem]"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
                  if (e.key === 'Escape') cancelEdit()
                }}
              />
              <div className="flex gap-1.5 justify-end">
                <button onClick={cancelEdit} className="btn-ghost text-xs px-2 py-0.5 flex items-center gap-1">
                  <X size={11} /> Cancel
                </button>
                <button onClick={submitEdit} className="btn-primary text-xs px-2 py-0.5">
                  Send
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div
              className={clsx(
                'prose prose-sm max-w-none',
                message.isStreaming && !message.content && 'streaming-cursor'
              )}
              style={{ color: 'var(--text-primary)' }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                disallowedElements={['script']}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isBlock = match !== null
                    if (isBlock) {
                      return (
                        <SyntaxHighlighter
                          style={oneDark as never}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem' }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      )
                    }
                    return (
                      <code
                        className={className}
                        style={{
                          background: 'var(--bg-tertiary)',
                          padding: '0.15em 0.4em',
                          borderRadius: '0.25rem',
                          fontSize: '0.85em',
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  p({ children }) {
                    return <p style={{ margin: '0.4em 0' }}>{children}</p>
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)' }}
                      >
                        {children}
                      </a>
                    )
                  },
                  table({ children }) {
                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
                          {children}
                        </table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return (
                      <th style={{ borderBottom: '1px solid var(--border)', padding: '0.4rem 0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td style={{ borderBottom: '1px solid var(--border)', padding: '0.4rem 0.75rem' }}>
                        {children}
                      </td>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && message.content && (
                <span className="streaming-cursor" />
              )}
            </div>
          )}
        </div>

        {/* Action row */}
        <div className={clsx('flex items-center gap-0.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <CopyButton text={message.content} />

          <button
            onClick={() => onBookmark(message.id)}
            className={clsx(
              'p-1 rounded transition-opacity btn-ghost',
              message.bookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            style={message.bookmarked ? { color: 'var(--accent)' } : undefined}
            title={message.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {message.bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>

          {isUser && !isStreaming && (
            <button
              onClick={() => { setEditDraft(message.content); setEditing(true) }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity btn-ghost"
              title="Edit message"
            >
              <Edit2 size={13} />
            </button>
          )}

          {!isUser && isLast && !isStreaming && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity btn-ghost"
              title="Regenerate response"
            >
              <RefreshCw size={13} />
            </button>
          )}

          <button
            onClick={() => onBranch(message.id)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity btn-ghost"
            title="Branch from here"
          >
            <GitBranch size={13} />
          </button>

          {message.tokenCount != null && (
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
              {estimateCost(message.tokenCount)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
