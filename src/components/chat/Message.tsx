import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import type { Message as MessageType } from '../../types'

interface MessageProps {
  message: MessageType
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

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={clsx(
        'flex gap-3 px-4 py-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar dot */}
      <div
        className={clsx(
          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
          isUser ? 'bg-accent' : 'bg-surface'
        )}
        style={
          isUser
            ? { background: 'var(--accent)', color: 'white' }
            : { background: 'var(--surface)', color: 'var(--text-secondary)' }
        }
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={clsx('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={clsx(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative',
            isUser ? 'user-bubble rounded-tr-sm' : 'surface rounded-tl-sm'
          )}
          style={{
            background: isUser ? 'var(--user-bubble)' : 'var(--surface)',
          }}
        >
          {isUser ? (
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
                        <table
                          style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            fontSize: '0.85rem',
                          }}
                        >
                          {children}
                        </table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return (
                      <th
                        style={{
                          borderBottom: '1px solid var(--border)',
                          padding: '0.4rem 0.75rem',
                          textAlign: 'left',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td
                        style={{
                          borderBottom: '1px solid var(--border)',
                          padding: '0.4rem 0.75rem',
                        }}
                      >
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
        <div className={clsx('flex gap-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <CopyButton text={message.content} />
        </div>
      </div>
    </div>
  )
}
