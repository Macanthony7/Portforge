# LLM Provider Guide

Portforge talks to LLMs through two API styles: **OpenAI-compatible** and **Anthropic-compatible**. Keys live on the server — the browser never receives them.

## Supported Styles

| Style | Env vars | Default base URL | Endpoint |
|---|---|---|---|
| **OpenAI-compatible** | `OPENAI_API_KEY`, `OPENAI_BASE_URL` | `https://api.openai.com/v1` | `{base}/chat/completions` |
| **Anthropic-compatible** | `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL` | `https://api.anthropic.com/v1` | `{base}/messages` |

Gateways that implement the OpenAI chat-completions API — Groq, Moonshot, GLM, NVIDIA NIM, a local Ollama server, and others — work through the OpenAI-compatible style by changing `OPENAI_BASE_URL`.

## Getting started

1. Choose a style.
2. Set its API key env var on the server (for example in `.env.local`):

   ```bash
   OPENAI_API_KEY=sk-...
   # or
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. To use a gateway, set the matching base URL env var (for example `OPENAI_BASE_URL=https://api.groq.com/openai/v1`).
4. In **Settings → LLM Configuration**, select the **API style** and enter a model id.
5. Click **Test Connection** to verify.

## Notes

- **Keys are server-only.** The proxy reads them from `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`; no key is stored in or sent to the browser.
- **Any model id is accepted.** Suggested models are starting points; the upstream API validates the id.
- **Base URLs** may point at any OpenAI-compatible or Anthropic-compatible host. Trailing slashes are trimmed before the style path is appended.
