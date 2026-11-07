import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/llm/providers'
import { PROVIDER_CONFIGS } from '@/lib/llm/config'
import type { LLMProvider } from '@/types'

type ProxyBody = {
  provider?: string
  model?: string
  prompt?: string
  maxTokens?: number
  test?: boolean
}

function isStyle(value: unknown): value is LLMProvider {
  return value === 'openai' || value === 'anthropic'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProxyBody
    const { provider, model, prompt, maxTokens = 4096, test = false } = body

    if (!isStyle(provider)) {
      return NextResponse.json({ error: 'provider must be one of: openai, anthropic' }, { status: 400 })
    }

    if (typeof model !== 'string' || !model.trim()) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 })
    }

    if (!test && !prompt) {
      return NextResponse.json({ error: 'prompt is required for non-test requests' }, { status: 400 })
    }

    // If PROXY_SECRET is set, require the matching header for protection
    const proxySecret = process.env.PROXY_SECRET
    if (proxySecret) {
      const providedSecret = req.headers.get('x-proxy-secret') || ''
      if (providedSecret !== proxySecret) {
        return NextResponse.json({ error: 'Missing or invalid proxy secret' }, { status: 403 })
      }
    }

    // Keys and base URLs come only from server env, never from the request.
    const config = PROVIDER_CONFIGS[provider]
    const apiKey = process.env[config.apiKeyEnv]
    if (!apiKey) {
      return NextResponse.json({ error: `Missing API key: set ${config.apiKeyEnv} on the server` }, { status: 400 })
    }

    const baseUrl = (process.env[config.baseUrlEnv] || config.defaultBaseUrl).replace(/\/+$/, '')

    const adapter = getAdapter(provider)
    const endpoint = adapter.endpoint(baseUrl)
    const headers = adapter.headers(apiKey)
    const upstreamBody = test ? adapter.testBody(model) : adapter.body(prompt || '', model, maxTokens)

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(upstreamBody),
    })

    // Forward status and headers; stream body directly
    const responseHeaders = new Headers()
    upstream.headers.forEach((v, k) => responseHeaders.set(k, v))

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Proxy error' }, { status: 500 })
  }
}
