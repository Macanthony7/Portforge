import type { LLMProvider } from '@/types'

export interface StreamChunk {
  text: string
  done: boolean
}

export interface ProviderAdapter {
  endpoint: (baseUrl: string) => string
  headers: (apiKey: string) => Record<string, string>
  body: (prompt: string, model: string, maxTokens: number) => unknown
  parseStream: (line: string) => StreamChunk | null
  testBody: (model: string) => unknown
}

function openaiCompatibleParse(line: string): StreamChunk | null {
  if (!line.startsWith('data: ')) return null
  const data = line.slice(6)
  if (data === '[DONE]') return { text: '', done: true }
  try {
    const parsed = JSON.parse(data)
    const text = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || ''
    return { text, done: false }
  } catch {
    return null
  }
}

export const PROVIDER_ADAPTERS: Record<LLMProvider, ProviderAdapter> = {
  anthropic: {
    endpoint: (baseUrl) => `${baseUrl}/messages`,
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
    body: (prompt, model, maxTokens) => ({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
    parseStream: (line) => {
      if (!line.startsWith('data: ')) return null
      const data = line.slice(6)
      if (data === '[DONE]') return { text: '', done: true }
      try {
        const parsed = JSON.parse(data)
        const text = parsed.delta?.text || ''
        return { text, done: false }
      } catch {
        return null
      }
    },
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
  },

  openai: {
    endpoint: (baseUrl) => `${baseUrl}/chat/completions`,
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (prompt, model, maxTokens) => ({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
    parseStream: openaiCompatibleParse,
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
  },
}

export function getAdapter(provider: LLMProvider): ProviderAdapter {
  return PROVIDER_ADAPTERS[provider]
}
