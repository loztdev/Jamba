import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ChatSearch } from '../chat/ChatSearch'

interface AppLayoutProps {
  children: React.ReactNode
  onOpenSettings: () => void
}

export function AppLayout({ children, onOpenSettings }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="flex h-full overflow-hidden app-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onOpenSettings={onOpenSettings}
        onOpenSearch={() => setShowSearch(true)}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
      {showSearch && <ChatSearch onClose={() => setShowSearch(false)} />}
    </div>
  )
}
