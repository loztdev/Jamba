import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chat, Message, Character, Prompt, TokenUsage } from '../types'
import { BUILT_IN_PROMPTS } from '../data/builtInPrompts'
import { BUILT_IN_CHARACTERS } from '../data/builtInCharacters'

function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  prompts: Prompt[]
  characters: Character[]

  // Chat actions
  createChat: (modelId: string) => string
  updateChat: (id: string, updates: Partial<Omit<Chat, 'id'>>) => void
  deleteChat: (id: string) => void
  setActiveChatId: (id: string | null) => void
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => Message
  updateMessage: (chatId: string, messageId: string, content: string) => void
  finalizeMessage: (chatId: string, messageId: string) => void
  setMessageUsage: (chatId: string, messageId: string, usage: TokenUsage) => void
  forkChat: (sourceChatId: string, upToMessageId: string) => string
  exportChats: () => void

  // Prompt actions
  addPrompt: (p: Omit<Prompt, 'id'>) => void
  updatePrompt: (id: string, updates: Partial<Prompt>) => void
  deletePrompt: (id: string) => void

  // Character actions
  addCharacter: (c: Omit<Character, 'id'>) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  deleteCharacter: (id: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      prompts: BUILT_IN_PROMPTS,
      characters: BUILT_IN_CHARACTERS,

      createChat: (modelId) => {
        const id = nanoid()
        const chat: Chat = {
          id,
          title: 'New Chat',
          modelId,
          characterId: null,
          systemPrompt: '',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ chats: [chat, ...s.chats], activeChatId: id }))
        return id
      },

      updateChat: (id, updates) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        }))
      },

      deleteChat: (id) => {
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id)
          const activeChatId =
            s.activeChatId === id ? (chats[0]?.id ?? null) : s.activeChatId
          return { chats, activeChatId }
        })
      },

      setActiveChatId: (id) => set({ activeChatId: id }),

      addMessage: (chatId, msg) => {
        const message: Message = {
          ...msg,
          id: nanoid(),
          createdAt: Date.now(),
        }
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c
            const messages = [...c.messages, message]
            const title =
              c.title === 'New Chat' && msg.role === 'user'
                ? typeof msg.content === 'string'
                  ? msg.content.slice(0, 52).trim()
                  : '[Attached file]'
                : c.title
            return { ...c, messages, title, updatedAt: Date.now() }
          }),
        }))
        return message
      },

      updateMessage: (chatId, messageId, content) => {
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m
              ),
              updatedAt: Date.now(),
            }
          }),
        }))
      },

      finalizeMessage: (chatId, messageId) => {
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, isStreaming: false } : m
              ),
            }
          }),
        }))
      },

      setMessageUsage: (chatId, messageId, usage) => {
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, tokenUsage: usage } : m
              ),
            }
          }),
        }))
      },

      forkChat: (sourceChatId, upToMessageId) => {
        const { chats } = get()
        const source = chats.find((c) => c.id === sourceChatId)
        if (!source) return ''
        const cutIndex = source.messages.findIndex((m) => m.id === upToMessageId)
        if (cutIndex === -1) return ''
        const id = nanoid()
        const fork: Chat = {
          id,
          title: `Fork of ${source.title}`,
          modelId: source.modelId,
          characterId: source.characterId,
          systemPrompt: source.systemPrompt,
          messages: source.messages.slice(0, cutIndex + 1),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ chats: [fork, ...s.chats], activeChatId: id }))
        return id
      },

      exportChats: () => {
        const { chats } = get()
        const blob = new Blob([JSON.stringify(chats, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `jamba-chats-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },

      addPrompt: (p) => {
        const prompt: Prompt = { ...p, id: nanoid() }
        set((s) => ({ prompts: [...s.prompts, prompt] }))
      },

      updatePrompt: (id, updates) => {
        set((s) => ({
          prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },

      deletePrompt: (id) => {
        set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) }))
      },

      addCharacter: (c) => {
        const character: Character = { ...c, id: nanoid() }
        set((s) => ({ characters: [...s.characters, character] }))
      },

      updateCharacter: (id, updates) => {
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }))
      },

      deleteCharacter: (id) => {
        set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }))
      },
    }),
    {
      name: 'jamba-chats',
      partialize: (state) => ({
        chats: state.chats.map((c) => ({
          ...c,
          // Clear streaming flag on persist
          messages: c.messages.map((m) => ({ ...m, isStreaming: false })),
        })),
        activeChatId: state.activeChatId,
        prompts: state.prompts.filter((p) => !p.isBuiltIn),
        characters: state.characters.filter((c) => !c.isBuiltIn),
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ChatState>
        return {
          ...current,
          chats: p.chats ?? [],
          activeChatId: p.activeChatId ?? null,
          prompts: [
            ...BUILT_IN_PROMPTS,
            ...(p.prompts ?? []),
          ],
          characters: [
            ...BUILT_IN_CHARACTERS,
            ...(p.characters ?? []),
          ],
        }
      },
    }
  )
)
