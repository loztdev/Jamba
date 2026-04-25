import { useState, useCallback } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { ChatView } from './components/chat/ChatView'
import { ModelPicker } from './components/models/ModelPicker'
import { PromptLibrary } from './components/prompts/PromptLibrary'
import { CharacterSelector } from './components/characters/CharacterSelector'
import { SettingsModal } from './components/settings/SettingsModal'
import { Starfield } from './components/Starfield'
import { useIdleTimer } from './hooks/useIdleTimer'
import { useChatStore } from './store/chatStore'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showCharacters, setShowCharacters] = useState(false)
  const [isIdle, setIsIdle] = useState(false)

  const activeChatId = useChatStore((s) => s.activeChatId)

  const handleIdle = useCallback(() => setIsIdle(true), [])
  const handleActive = useCallback(() => setIsIdle(false), [])

  useIdleTimer(15_000, handleIdle, handleActive)

  return (
    <>
      <AppLayout onOpenSettings={() => setShowSettings(true)}>
        <ChatView
          onOpenModelPicker={() => setShowModelPicker(true)}
          onOpenPrompts={() => setShowPrompts(true)}
          onOpenCharacters={() => setShowCharacters(true)}
          onNeedApiKey={() => setShowSettings(true)}
        />
      </AppLayout>

      {/* Modals & panels */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showModelPicker && (
        <ModelPicker
          onClose={() => setShowModelPicker(false)}
          chatId={activeChatId}
        />
      )}
      {showPrompts && <PromptLibrary onClose={() => setShowPrompts(false)} />}
      {showCharacters && <CharacterSelector onClose={() => setShowCharacters(false)} />}

      {/* Starfield idle animation */}
      {isIdle && <Starfield onDismiss={() => setIsIdle(false)} />}
    </>
  )
}
