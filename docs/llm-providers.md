# LLM Providers

Portforge supports two API styles: **OpenAI-compatible** and **Anthropic-compatible**. Both are configured entirely on the server with environment variables — the browser never receives an API key.

---

## Table of Contents

- [How Keys Work](#how-keys-work)
- [API Styles](#api-styles)
  - [OpenAI-compatible](#openai-compatible)
  - [Anthropic-compatible](#anthropic-compatible)
- [Using a Gateway](#using-a-gateway)
- [Adding a New Style](#adding-a-new-style)

---

## How Keys Work

1. Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in the server environment (for example in `.env.local`).
2. Optionally set `OPENAI_BASE_URL` / `ANTHROPIC_BASE_URL` to route that style through a gateway.
3. In **Settings → LLM Configuration**, choose the matching **API style** and model id.
4. The browser sends only the style, model, and prompt to `/api/llm/proxy`. The proxy reads the key from the server environment and calls the upstream API.

Keys stay on the server and are never sent to the browser. There is no browser-side key storage.

---

## API Styles

### OpenAI-compatible

| | |
|---|---|
| Env vars | `OPENAI_API_KEY`, `OPENAI_BASE_URL` |
| Default base URL | `https://api.openai.com/v1` |
| Endpoint | `POST {base}/chat/completions` |
| Auth header | `Authorization: Bearer <key>` |
| Stream format | OpenAI SSE (`data: {...}`) |

Suggested models: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`.

This style also covers any gateway that implements the OpenAI chat-completions API.

### Anthropic-compatible

| | |
|---|---|
| Env vars | `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL` |
| Default base URL | `https://api.anthropic.com/v1` |
| Endpoint | `POST {base}/messages` |
| Auth headers | `x-api-key: <key>`, `anthropic-version: 2023-06-01` |
| Stream format | Anthropic SSE (`delta.text`) |

Suggested models: `claude-sonnet-4-20250514`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`.

---

## Using a Gateway

Groq, Moonshot, GLM, NVIDIA NIM, and local servers such as Ollama expose an OpenAI-compatible API. Use the **OpenAI-compatible** style and change the base URL:

```bash
# Groq
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1

# Moonshot
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.moonshot.cn/v1

# GLM
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# NVIDIA NIM
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1

# Local OpenAI-compatible server
OPENAI_API_KEY=local
OPENAI_BASE_URL=http://localhost:11434/v1
```

Then set the model id in Settings to a model the gateway supports. Any non-empty model id is accepted; the upstream API reports invalid ids.

Trailing slashes on base URLs are trimmed before the style path is appended.

---

## Adding a New Style

A style is a wire protocol, not a vendor. To add one:

1. Add the style id to the `LLMProvider` union in `src/types/index.ts`.
2. Add `ProviderConfig` metadata (label, env var names, default base URL, suggested models) to `PROVIDER_CONFIGS` in `src/lib/llm/config.ts`.
3. Add a `ProviderAdapter` entry to `PROVIDER_ADAPTERS` in `src/lib/llm/providers.ts` with its endpoint path, headers, bodies, and stream parser.

The proxy and Settings pick the new style up from that metadata.
