import { useRef, useState } from 'react'
import { streamChat } from '../api/openrouter'
import { useChatStore } from '../store/chatStore'
import { useSettingsStore } from '../store/settingsStore'
import type { Message } from '../types'

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const finalizeMessage = useChatStore((s) => s.finalizeMessage)
  const chats = useChatStore((s) => s.chats)
  const apiKey = useSettingsStore((s) => s.apiKey)

  function cancelStream() {
    cancelRef.current?.()
    cancelRef.current = null
    setIsStreaming(false)
  }

  function sendMessage(chatId: string, userContent: string) {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    // Cancel any in-progress stream
    cancelRef.current?.()

    // Add user message
    addMessage(chatId, { role: 'user', content: userContent })

    // Add placeholder assistant message
    const assistantMsg: Message = addMessage(chatId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
    })

    setIsStreaming(true)

    // Build the messages array from chat history (excluding the new empty assistant msg)
    const historyMessages = [
      ...chat.messages,
      { id: '', role: 'user' as const, content: userContent, createdAt: Date.now() },
    ].map(({ role, content }) => ({ role, content }))

    let accumulated = ''

    const cancel = streamChat({
      apiKey,
      modelId: chat.modelId,
      messages: historyMessages,
      systemPrompt: chat.systemPrompt || undefined,
      onDelta: (delta) => {
        accumulated += delta
        updateMessage(chatId, assistantMsg.id, accumulated)
      },
      onDone: () => {
        finalizeMessage(chatId, assistantMsg.id)
        setIsStreaming(false)
        cancelRef.current = null
      },
      onError: (err) => {
        updateMessage(chatId, assistantMsg.id, `⚠️ Error: ${err.message}`)
        finalizeMessage(chatId, assistantMsg.id)
        setIsStreaming(false)
        cancelRef.current = null
      },
    })

    cancelRef.current = cancel
  }

  return { sendMessage, isStreaming, cancelStream }
}
