import { useRef, useState } from 'react'
import { streamChat } from '../api/openrouter'
import { useChatStore } from '../store/chatStore'
import { useSettingsStore } from '../store/settingsStore'
import { attachmentsToContentParts } from '../utils/attachments'
import type { Message, Attachment } from '../types'

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const finalizeMessage = useChatStore((s) => s.finalizeMessage)
  const setMessageUsage = useChatStore((s) => s.setMessageUsage)
  const chats = useChatStore((s) => s.chats)
  const apiKey = useSettingsStore((s) => s.apiKey)
  const pushRecentModel = useSettingsStore((s) => s.pushRecentModel)

  function cancelStream() {
    cancelRef.current?.()
    cancelRef.current = null
    setIsStreaming(false)
  }

  function sendMessage(chatId: string, userContent: string, attachments: Attachment[] = []) {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    pushRecentModel(chat.modelId)

    // Cancel any in-progress stream
    cancelRef.current?.()

    const messageContent = attachments.length > 0
      ? attachmentsToContentParts(userContent, attachments)
      : userContent

    // Add user message
    addMessage(chatId, {
      role: 'user',
      content: messageContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

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
      { id: '', role: 'user' as const, content: messageContent, createdAt: Date.now() },
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
      onUsage: (usage) => {
        setMessageUsage(chatId, assistantMsg.id, usage)
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
