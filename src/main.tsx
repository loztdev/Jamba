import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply theme before first render to prevent flash of unstyled content
try {
  const stored = localStorage.getItem('jamba-settings')
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
