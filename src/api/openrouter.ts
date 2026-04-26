import type { Model, Message } from '../types'

const BASE_URL = 'https://openrouter.ai/api/v1'

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Jamba',
  }
}

export async function fetchModels(apiKey: string): Promise<Model[]> {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: headers(apiKey),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch models: ${res.status} ${text}`)
  }
  const data = await res.json()
  return (data.data as Model[]) ?? []
}

export interface CompleteChatOptions {
  apiKey: string
  modelId: string
  messages: Pick<Message, 'role' | 'content'>[]
  systemPrompt?: string
  signal?: AbortSignal
  temperature?: number
}

export async function completeChat(opts: CompleteChatOptions): Promise<string> {
  const { apiKey, modelId, messages, systemPrompt, signal, temperature } = opts
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers(apiKey),
    signal,
    body: JSON.stringify({
      model: modelId,
      stream: false,
      ...(temperature !== undefined ? { temperature } : {}),
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : [...messages],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('No content returned from model.')
  }
  return content
}

export type StreamChatOptions = {
  apiKey: string
  modelId: string
  messages: Pick<Message, 'role' | 'content'>[]
  systemPrompt?: string
  onDelta: (delta: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

export function streamChat(opts: StreamChatOptions): () => void {
  const { apiKey, modelId, messages, systemPrompt, onDelta, onDone, onError } = opts
  const controller = new AbortController()

  const payload: {
    model: string
    messages: { role: string; content: string }[]
    stream: boolean
  } = {
    model: modelId,
    stream: true,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : [...messages],
  }

  ;(async () => {
    let res: Response
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') onError(err as Error)
      return
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      onError(new Error(`HTTP ${res.status}: ${text}`))
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          onDone()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) {
              onDelta(delta)
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') onError(err as Error)
    }
  })()

  return () => controller.abort()
}
