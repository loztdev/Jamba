import { useState } from 'react'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  onOpenSettings: () => void
  onOpenBookmarks: () => void
  view: 'chat' | 'characters'
  onChangeView: (v: 'chat' | 'characters') => void
}

export function AppLayout({
  children,
  onOpenSettings,
  onOpenBookmarks,
  view,
  onChangeView,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-full overflow-hidden app-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onOpenSettings={onOpenSettings}
        onOpenBookmarks={onOpenBookmarks}
        view={view}
        onChangeView={onChangeView}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
