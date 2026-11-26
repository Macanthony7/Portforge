import type { LLMConfig } from '@/types'
import { getAdapter } from './providers'

export interface GenerateOptions {
  prompt: string
  maxTokens?: number
  onChunk?: (chunk: string) => void
}

async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '')
  try {
    const parsed = JSON.parse(text)
    const message = typeof parsed?.error === 'string' ? parsed.error : parsed?.error?.message
    if (typeof message === 'string') return message
  } catch {
    // Not JSON — fall through to the raw body.
  }
  return text || `HTTP ${res.status}`
}

export class LLMClient {
  constructor(private config: LLMConfig) {}

  private get adapter() {
    return getAdapter(this.config.provider)
  }

  async generateText(options: GenerateOptions): Promise<string> {
    const { prompt, maxTokens = 4096, onChunk } = options
    const adapter = this.adapter

    const res = await fetch('/api/llm/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: this.config.provider, model: this.config.model, prompt, maxTokens }),
    })

    if (!res.ok) {
      throw new Error(`LLM request failed: ${res.status} ${await errorMessage(res)}`)
    }

    if (!res.body) {
      throw new Error('No response body')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const result = adapter.parseStream(trimmed)
        if (result && result.text) {
          fullText += result.text
          onChunk?.(result.text)
        }
      }
    }

    return fullText
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/llm/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.config.provider, model: this.config.model, test: true }),
      })

      if (!res.ok) {
        return { success: false, error: await errorMessage(res) }
      }

      const data = await res.json().catch(() => null)
      if (!data) return { success: false, error: 'Invalid response' }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  async *streamText(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const { prompt, maxTokens = 4096 } = options
    const adapter = this.adapter

    const res = await fetch('/api/llm/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: this.config.provider, model: this.config.model, prompt, maxTokens }),
    })

    if (!res.ok) {
      throw new Error(`LLM request failed: ${res.status} ${await errorMessage(res)}`)
    }

    if (!res.body) {
      throw new Error('No response body')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const result = adapter.parseStream(trimmed)
        if (result && result.text) {
          yield result.text
        }
      }
    }
  }
}

export function createLLMClient(config: LLMConfig): LLMClient {
  return new LLMClient(config)
}
