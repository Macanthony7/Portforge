import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/llm/providers'
import type { LLMProvider } from '@/types'

type ProxyBody = {
  provider: LLMProvider
  model: string
  prompt?: string
  maxTokens?: number
  customEndpoint?: string
  test?: boolean
  clientApiKey?: string
}

const ENV_KEY_MAP: Record<LLMProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
  nvidia: 'NVIDIA_API_KEY',
  groq: 'GROQ_API_KEY',
  moonshot: 'MOONSHOT_API_KEY',
  'z-ai': 'ZAI_API_KEY',
  minimax: 'MINIMAX_API_KEY',
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProxyBody
    const { provider, model, prompt, maxTokens = 4096, customEndpoint, test = false } = body

    if (!provider || !model) {
      return NextResponse.json({ error: 'provider and model are required' }, { status: 400 })
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

    const clientApiKey = body.clientApiKey || req.headers.get('authorization')?.split(' ')[1]
    const envKey = ENV_KEY_MAP[provider]
    const envApiKey = envKey ? process.env[envKey] : undefined
    const chosenApiKey = clientApiKey || envApiKey
    if (!chosenApiKey) {
      return NextResponse.json({ error: `Missing API key for provider: ${provider}. Provide clientApiKey or set ${envKey}` }, { status: 400 })
    }

    const adapter = getAdapter(provider)
    const endpoint = adapter.endpoint({ model, customEndpoint })
    const headers = adapter.headers(chosenApiKey)
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
