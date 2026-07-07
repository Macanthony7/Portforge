import type { LLMProvider } from '@/types'

export interface StreamChunk {
  text: string
  done: boolean
}

export interface ProviderAdapter {
  endpoint: (config: { model: string; customEndpoint?: string }) => string
  headers: (apiKey: string) => Record<string, string>
  body: (prompt: string, model: string, maxTokens: number) => unknown
  parseStream: (line: string) => StreamChunk | null
  testMessage: string
  testBody: (model: string) => unknown
  parseTest: (response: Response) => Promise<{ success: boolean; error?: string }>
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
    endpoint: () => 'https://api.anthropic.com/v1/messages',
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
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      const data = await res.json().catch(() => null)
      if (!data) return { success: false, error: 'Invalid response' }
      return { success: true }
    },
  },

  openai: {
    endpoint: () => 'https://api.openai.com/v1/chat/completions',
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
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      const data = await res.json().catch(() => null)
      if (!data) return { success: false, error: 'Invalid response' }
      return { success: true }
    },
  },

  google: {
    endpoint: ({ model, customEndpoint }) => {
      if (customEndpoint) return `${customEndpoint.replace(/\/+$/, '')}/models/${model}:streamGenerateContent`
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`
    },
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    }),
    body: (prompt, _model, maxTokens) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    // Gemini uses SSE-like newline-delimited JSON, not exactly OpenAI format
    parseStream: (line) => {
      if (!line.trim()) return null
      try {
        const parsed = JSON.parse(line)
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
        return { text, done: false }
      } catch {
        return null
      }
    },
    testMessage: 'Say "connected" and nothing else.',
    testBody: () => ({
      contents: [{ parts: [{ text: 'Say "connected" and nothing else.' }] }],
      generationConfig: { maxOutputTokens: 10 },
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      const data = await res.json().catch(() => null)
      if (!data) return { success: false, error: 'Invalid response' }
      return { success: true }
    },
  },

  nvidia: {
    endpoint: ({ customEndpoint }) => {
      const base = (customEndpoint || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '')
      return `${base}/chat/completions`
    },
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (prompt, model, maxTokens) => ({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.5,
      top_p: 1,
    }),
    parseStream: openaiCompatibleParse,
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      return { success: true }
    },
  },

  groq: {
    endpoint: () => 'https://api.groq.com/openai/v1/chat/completions',
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
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      return { success: true }
    },
  },

  moonshot: {
    endpoint: () => 'https://api.moonshot.cn/v1/chat/completions',
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
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      return { success: true }
    },
  },

  'z-ai': {
    endpoint: () => 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
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
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      return { success: true }
    },
  },

  minimax: {
    endpoint: () => 'https://api.minimax.chat/v1/text/chatcompletion_v2',
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
    testMessage: 'Say "connected" and nothing else.',
    testBody: (model) => ({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      stream: false,
    }),
    parseTest: async (res) => {
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` }
      return { success: true }
    },
  },
}

export function getAdapter(provider: LLMProvider): ProviderAdapter {
  return PROVIDER_ADAPTERS[provider]
}
