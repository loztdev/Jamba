import { useState } from 'react'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  onOpenSettings: () => void
}

export function AppLayout({ children, onOpenSettings }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-full overflow-hidden app-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onOpenSettings={onOpenSettings}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
