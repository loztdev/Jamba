import { useState, useCallback, useEffect } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { ChatView } from './components/chat/ChatView'
import { ModelPicker } from './components/models/ModelPicker'
import { PromptLibrary } from './components/prompts/PromptLibrary'
import { CharacterSelector } from './components/characters/CharacterSelector'
import { SettingsModal } from './components/settings/SettingsModal'
import { BookmarksPanel } from './components/bookmarks/BookmarksPanel'
import { Starfield } from './components/Starfield'
import { useIdleTimer } from './hooks/useIdleTimer'
import { useChatStore } from './store/chatStore'
import { useSettingsStore } from './store/settingsStore'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showCharacters, setShowCharacters] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [isIdle, setIsIdle] = useState(false)

  const activeChatId = useChatStore((s) => s.activeChatId)
  const createChat = useChatStore((s) => s.createChat)
  const setActiveChatId = useChatStore((s) => s.setActiveChatId)
  const idleAnimation = useSettingsStore((s) => s.idleAnimation)
  const defaultModelId = useSettingsStore((s) => s.defaultModelId)
  const apiKey = useSettingsStore((s) => s.apiKey)

  const handleIdle = useCallback(() => setIsIdle(true), [])
  const handleActive = useCallback(() => setIsIdle(false), [])

  useIdleTimer(15_000, handleIdle, handleActive)

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      // Don't fire when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const isInput = tag === 'input' || tag === 'textarea'

      if (e.key === 'Escape') {
        setShowSettings(false)
        setShowModelPicker(false)
        setShowPrompts(false)
        setShowCharacters(false)
        setShowBookmarks(false)
        setIsIdle(false)
        return
      }

      if (ctrl && !isInput) {
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault()
          setShowModelPicker((v) => !v)
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault()
          if (apiKey) createChat(defaultModelId)
          else setShowSettings(true)
        } else if (e.key === '/') {
          e.preventDefault()
          setShowPrompts((v) => !v)
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault()
          setShowBookmarks((v) => !v)
        } else if (e.key === ',') {
          e.preventDefault()
          setShowSettings((v) => !v)
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [apiKey, createChat, defaultModelId])

  function handleNavigateToChat(chatId: string) {
    setActiveChatId(chatId)
  }

  return (
    <>
      <AppLayout
        onOpenSettings={() => setShowSettings(true)}
        onOpenBookmarks={() => setShowBookmarks(true)}
      >
        <ChatView
          onOpenModelPicker={() => setShowModelPicker(true)}
          onOpenPrompts={() => setShowPrompts(true)}
          onOpenCharacters={() => setShowCharacters(true)}
          onNeedApiKey={() => setShowSettings(true)}
        />
      </AppLayout>

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showModelPicker && (
        <ModelPicker onClose={() => setShowModelPicker(false)} chatId={activeChatId} />
      )}
      {showPrompts && <PromptLibrary onClose={() => setShowPrompts(false)} />}
      {showCharacters && <CharacterSelector onClose={() => setShowCharacters(false)} />}
      {showBookmarks && (
        <BookmarksPanel
          onClose={() => setShowBookmarks(false)}
          onNavigateToChat={handleNavigateToChat}
        />
      )}

      {/* Idle animation */}
      {isIdle && (
        <Starfield
          onDismiss={() => setIsIdle(false)}
          animationType={idleAnimation}
        />
      )}
    </>
  )
}
