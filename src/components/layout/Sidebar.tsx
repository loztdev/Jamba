import { useState } from 'react'
import { MessageSquare, Plus, Trash2, Download, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useSettingsStore } from '../../store/settingsStore'
import clsx from 'clsx'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onOpenSettings: () => void
}

export function Sidebar({ collapsed, onToggle, onOpenSettings }: SidebarProps) {
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const createChat = useChatStore((s) => s.createChat)
  const deleteChat = useChatStore((s) => s.deleteChat)
  const setActiveChatId = useChatStore((s) => s.setActiveChatId)
  const exportChats = useChatStore((s) => s.exportChats)
  const defaultModelId = useSettingsStore((s) => s.defaultModelId)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  function handleNewChat() {
    createChat(defaultModelId)
  }

  function handleDeleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (deleteConfirmId === id) {
      deleteChat(id)
      setDeleteConfirmId(null)
    } else {
      setDeleteConfirmId(id)
      setTimeout(() => setDeleteConfirmId(null), 2500)
    }
  }

  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <aside
      className={clsx(
        'flex flex-col h-full border-r border-subtle transition-all duration-200',
        collapsed ? 'w-12' : 'w-64'
      )}
      style={{ background: 'var(--bg-secondary)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-subtle shrink-0">
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight accent-text">Jamba</span>
        )}
        <button
          onClick={onToggle}
          className={clsx('btn-ghost p-1.5 rounded-md', collapsed && 'mx-auto')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* New Chat button */}
      <div className="p-2 shrink-0">
        <button
          onClick={handleNewChat}
          className={clsx(
            'btn-primary flex items-center gap-2 w-full justify-center text-sm',
            collapsed ? 'p-2' : 'px-3 py-2'
          )}
          title="New Chat"
        >
          <Plus size={16} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {sorted.length === 0 && !collapsed && (
          <p className="text-center text-muted text-xs px-4 py-8">No chats yet. Start a new one!</p>
        )}
        {sorted.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={clsx(
              'w-full flex items-center gap-2 px-2 py-2 mx-0 rounded-md text-left text-sm group transition-colors relative',
              activeChatId === chat.id
                ? 'bg-accent text-white'
                : 'hover:bg-tertiary'
            )}
            style={
              activeChatId === chat.id
                ? { background: 'var(--accent)', color: 'white' }
                : undefined
            }
            title={collapsed ? chat.title : undefined}
          >
            <MessageSquare
              size={14}
              className="shrink-0"
              style={activeChatId === chat.id ? { color: 'white' } : { color: 'var(--text-secondary)' }}
            />
            {!collapsed && (
              <>
                <span className="truncate flex-1 min-w-0">{chat.title}</span>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className={clsx(
                    'shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                    deleteConfirmId === chat.id
                      ? 'opacity-100 text-red-400'
                      : 'hover:text-red-400'
                  )}
                  style={{ color: deleteConfirmId === chat.id ? 'var(--danger)' : undefined }}
                  title={deleteConfirmId === chat.id ? 'Click again to confirm' : 'Delete chat'}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Footer actions */}
      <div className="border-t border-subtle p-2 shrink-0 flex flex-col gap-1">
        <button
          onClick={exportChats}
          className={clsx(
            'btn-ghost flex items-center gap-2 w-full text-sm',
            collapsed ? 'justify-center' : ''
          )}
          title="Export chats as JSON"
        >
          <Download size={15} />
          {!collapsed && <span>Export Chats</span>}
        </button>
        <button
          onClick={onOpenSettings}
          className={clsx(
            'btn-ghost flex items-center gap-2 w-full text-sm',
            collapsed ? 'justify-center' : ''
          )}
          title="Settings"
        >
          <Settings size={15} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  )
}
