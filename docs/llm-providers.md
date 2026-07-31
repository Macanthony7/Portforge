# LLM Providers

Portforge supports 8 LLM providers out of the box. All providers use a **Bring Your Own API Key (BYOAK)** model — your key is stored in your browser's `localStorage` and is never sent to any Portforge server.

---

## Table of Contents

- [How API Keys Work](#how-api-keys-work)
- [Provider Reference](#provider-reference)
  - [Anthropic](#anthropic)
  - [OpenAI](#openai)
  - [Google Gemini](#google-gemini)
  - [Groq](#groq)
  - [NVIDIA NIM](#nvidia-nim)
  - [Moonshot (Kimi)](#moonshot-kimi)
  - [Z-ai (GLM)](#z-ai-glm)
  - [Minimax](#minimax)
- [Custom Endpoints](#custom-endpoints)
- [Adding a New Provider](#adding-a-new-provider)

---

## How API Keys Work

### In the Browser (Local-First Mode)

1. You enter your API key in **Settings → LLM Configuration**.
2. The key is saved to `localStorage` under `portforge_apikey_<provider>`.
3. When you generate a document, the key is sent in the `clientApiKey` field of the request body to `/api/llm/proxy`.
4. The proxy uses the key for that request only — it is never logged or persisted server-side.

### In Hosted Deployments

You can set provider API keys as environment variables (e.g. `ANTHROPIC_API_KEY`). The proxy will fall back to these if no `clientApiKey` is provided. This lets you run a shared instance without requiring users to supply their own keys.

See the [env var reference](./cloud-setup.md#environment-variables) for all supported variable names.

---

## Provider Reference

### Anthropic

| | |
|---|---|
| API Key | [console.anthropic.com](https://console.anthropic.com) |
| Base URL | `https://api.anthropic.com/v1` |
| Auth Header | `x-api-key: <key>` |
| Stream Format | Server-Sent Events (SSE), Anthropic delta format |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet | 8192 | Best balance of speed and quality — recommended |
| `claude-3-opus-20240229` | Claude 3 Opus | 4096 | Highest capability, slower and more expensive |
| `claude-3-haiku-20240307` | Claude 3 Haiku | 4096 | Fastest and most affordable |

#### Notes

- Anthropic requires the `anthropic-version: 2023-06-01` header — Portforge sets this automatically.
- Streaming uses `delta.text` from SSE events, not the OpenAI-compatible format.

---

### OpenAI

| | |
|---|---|
| API Key | [platform.openai.com](https://platform.openai.com) |
| Base URL | `https://api.openai.com/v1` |
| Auth Header | `Authorization: Bearer <key>` |
| Stream Format | OpenAI SSE (`data: {...}`) |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `gpt-4o` | GPT-4o | 4096 | Multimodal, fast — recommended |
| `gpt-4-turbo` | GPT-4 Turbo | 4096 | Reliable workhorse |
| `gpt-4` | GPT-4 | 8192 | Legacy but stable |
| `gpt-3.5-turbo` | GPT-3.5 Turbo | 4096 | Fastest, most affordable |

---

### Google Gemini

| | |
|---|---|
| API Key | [aistudio.google.com](https://aistudio.google.com) |
| Base URL | `https://generativelanguage.googleapis.com/v1beta` |
| Auth Header | `x-goog-api-key: <key>` |
| Stream Format | Newline-delimited JSON (not OpenAI SSE) |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `gemini-2.0-flash-exp` | Gemini 2.0 Flash | 8192 | Fast, experimental |
| `gemini-1.5-pro` | Gemini 1.5 Pro | 8192 | Best quality |
| `gemini-1.5-flash` | Gemini 1.5 Flash | 8192 | Fast and affordable |

#### Notes

- The endpoint is model-specific: `…/models/<model>:streamGenerateContent`.
- Gemini uses a different request body format (`contents[].parts[].text`) — Portforge handles this automatically.
- Gemini has a generous free tier via AI Studio.

---

### Groq

| | |
|---|---|
| API Key | [console.groq.com](https://console.groq.com) |
| Base URL | `https://api.groq.com/openai/v1` |
| Auth Header | `Authorization: Bearer <key>` |
| Stream Format | OpenAI-compatible SSE |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `mixtral-8x7b-32768` | Mixtral 8x7B | 32768 | Long context, fast |
| `llama3-70b-8192` | Llama 3 70B | 8192 | High capability |
| `llama3-8b-8192` | Llama 3 8B | 8192 | Fastest, most affordable |

#### Notes

- Groq offers a free tier with generous rate limits — great for getting started.
- Inference is extremely fast due to Groq's custom LPU hardware.

---

### NVIDIA NIM

| | |
|---|---|
| API Key | [build.nvidia.com](https://build.nvidia.com) |
| Base URL | `https://integrate.api.nvidia.com/v1` |
| Auth Header | `Authorization: Bearer <key>` |
| Stream Format | OpenAI-compatible SSE |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `mistralai/mixtral-8x7b-instruct-v0.1` | Mixtral 8x7B | 4096 | Balanced |
| `meta/llama-3.1-8b-instruct` | Llama 3.1 8B | 4096 | Fast, lightweight |
| `meta/llama-3.1-70b-instruct` | Llama 3.1 70B | 4096 | High capability |

#### Notes

- NVIDIA NIM supports custom endpoints — useful if you're running NIM containers locally or on-prem.
- Set a custom endpoint in Settings if you're self-hosting.

---

### Moonshot (Kimi)

| | |
|---|---|
| API Key | [platform.moonshot.cn](https://platform.moonshot.cn) |
| Base URL | `https://api.moonshot.cn/v1` |
| Auth Header | `Authorization: Bearer <key>` |
| Stream Format | OpenAI-compatible SSE |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `moonshot-v1-8k` | Moonshot v1 8K | 8192 | Short context |
| `moonshot-v1-32k` | Moonshot v1 32K | 32768 | Medium context |
| `moonshot-v1-128k` | Moonshot v1 128K | 128000 | Very long context |

---

### Z-ai (GLM)

| | |
|---|---|
| API Key | [open.bigmodel.cn](https://open.bigmodel.cn) |
| Base URL | `https://open.bigmodel.cn/api/paas/v4` |
| Auth Header | `Authorization: Bearer <key>` |
| Stream Format | OpenAI-compatible SSE |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `glm-4-flash` | GLM-4 Flash | 4096 | Fast, affordable |
| `glm-4` | GLM-4 | 8192 | Balanced |
| `glm-4-plus` | GLM-4 Plus | 8192 | Highest capability |

---

### Minimax

| | |
|---|---|
| API Key | [platform.minimaxi.com](https://platform.minimaxi.com) |
| Base URL | `https://api.minimax.chat/v1` |
| Auth Header | `Authorization: Bearer <key>` |
| Stream Format | OpenAI-compatible SSE |

#### Models

| Model ID | Display Name | Max Tokens | Notes |
|----------|-------------|------------|-------|
| `minimax-01` | MiniMax-01 | 4096 | Flagship model |
| `minimax-text-01` | MiniMax Text-01 | 4096 | Text optimized |

---

## Custom Endpoints

Any provider that sets `requireCustomEndpoint: true` (currently NVIDIA NIM) will prompt for a custom base URL in Settings. You can also override the endpoint for any provider if you're running a compatible API locally (e.g., Ollama with an OpenAI-compatible interface).

To use a custom endpoint:

1. Go to **Settings → LLM Configuration**.
2. Select your provider.
3. Enter the full base URL in the **Custom Endpoint** field (e.g., `http://localhost:11434/v1`).
4. The endpoint field in the adapter will use your URL instead of the default.

---

## Adding a New Provider

To add a provider that isn't built in, follow these four steps:

### 1. Register the provider type

In `src/types/index.ts`, add your provider ID to the `LLMProvider` union:

```ts
export type LLMProvider =
  | 'anthropic'
  | 'openai'
  // ... existing providers
  | 'my-new-provider'   // add here
```

### 2. Add provider config

In `src/lib/llm/config.ts`, add an entry to `PROVIDER_CONFIGS`:

```ts
'my-new-provider': {
  name: 'My New Provider',
  baseUrl: 'https://api.mynewprovider.com/v1',
  models: [
    { id: 'model-id', name: 'Model Name', maxTokens: 4096, description: 'Description' },
  ],
},
```

### 3. Add the provider adapter

In `src/lib/llm/providers.ts`, add an entry to `PROVIDER_ADAPTERS`. If the provider uses the OpenAI-compatible SSE format, you can reuse `openaiCompatibleParse`:

```ts
'my-new-provider': {
  endpoint: () => 'https://api.mynewprovider.com/v1/chat/completions',
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
```

### 4. Add the env var mapping

In `src/app/api/llm/proxy/route.ts`, add the env var name to `ENV_KEY_MAP`:

```ts
const ENV_KEY_MAP: Record<LLMProvider, string> = {
  // ... existing entries
  'my-new-provider': 'MY_NEW_PROVIDER_API_KEY',
}
```

Your provider will now appear in the Settings dropdown automatically.
