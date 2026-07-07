import type { LLMConfig } from '@/types'
import { getAdapter } from './providers'
import { PROVIDER_CONFIGS } from './config'

export interface GenerateOptions {
  prompt: string
  maxTokens?: number
  onChunk?: (chunk: string) => void
}

export class LLMClient {
  constructor(private config: LLMConfig) {}

  private get adapter() {
    return getAdapter(this.config.provider)
  }

  private get baseUrl(): string {
    const custom = this.config.customEndpoint
    if (custom) return custom
    return PROVIDER_CONFIGS[this.config.provider].baseUrl
  }

  async generateText(options: GenerateOptions): Promise<string> {
    const { prompt, maxTokens = 4096, onChunk } = options
    const adapter = this.adapter
    // In browser, route requests to the server-side proxy to keep API keys secret
    const isBrowser = typeof window !== 'undefined'
    let res: Response

    if (isBrowser) {
      res = await fetch('/api/llm/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.config.provider, model: this.config.model, prompt, maxTokens, customEndpoint: this.config.customEndpoint, clientApiKey: this.config.apiKey }),
      })
    } else {
      const endpoint = adapter.endpoint({ model: this.config.model, customEndpoint: this.config.customEndpoint })
      const body = adapter.body(prompt, this.config.model, maxTokens)
      const headers = adapter.headers(this.config.apiKey)

      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
    }

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error')
      throw new Error(`LLM request failed: ${res.status} ${text}`)
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
      const adapter = this.adapter
      const isBrowser = typeof window !== 'undefined'
      if (isBrowser) {
        const res = await fetch('/api/llm/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: this.config.provider, model: this.config.model, test: true, customEndpoint: this.config.customEndpoint, clientApiKey: this.config.apiKey }),
        })
        // proxy.parseTest expects a Response-like object; delegate to adapter.parseTest if available
        return adapter.parseTest(res)
      }

      const endpoint = adapter.endpoint({ model: this.config.model, customEndpoint: this.config.customEndpoint })
      const body = adapter.testBody(this.config.model)
      const headers = adapter.headers(this.config.apiKey)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      return adapter.parseTest(res)
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  async *streamText(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const { prompt, maxTokens = 4096 } = options
    const adapter = this.adapter
    const isBrowser = typeof window !== 'undefined'
    let res: Response

    if (isBrowser) {
      res = await fetch('/api/llm/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.config.provider, model: this.config.model, prompt, maxTokens, customEndpoint: this.config.customEndpoint, clientApiKey: this.config.apiKey }),
      })
    } else {
      const endpoint = adapter.endpoint({ model: this.config.model, customEndpoint: this.config.customEndpoint })
      const body = adapter.body(prompt, this.config.model, maxTokens)
      const headers = adapter.headers(this.config.apiKey)

      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
    }

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error')
      throw new Error(`LLM request failed: ${res.status} ${text}`)
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
