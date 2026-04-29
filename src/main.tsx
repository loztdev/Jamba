import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Migrate localStorage from previous "jamba-" prefix to "openstarchat-"
// so existing users don't lose their settings or chats on first load.
try {
  for (const [oldKey, newKey] of [
    ['jamba-settings', 'openstarchat-settings'],
    ['jamba-chats', 'openstarchat-chats'],
  ]) {
    if (localStorage.getItem(newKey) == null) {
      const legacy = localStorage.getItem(oldKey)
      if (legacy != null) localStorage.setItem(newKey, legacy)
    }
  }
} catch {
  // private mode / quota — non-fatal
}

// Apply theme before first render to prevent flash of unstyled content
try {
  const stored = localStorage.getItem('openstarchat-settings')
  if (stored) {
    const theme = JSON.parse(stored)?.state?.theme
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
