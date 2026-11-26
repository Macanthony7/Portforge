# Portforge Cyber — Local-First Setup

Portforge stores your data in the browser and needs no database. LLM calls go through the app's built-in server proxy so API keys stay on the server.

## Quick Start

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it works

- **Storage**: All projects and data are stored in your browser using IndexedDB via Dexie.js.
- **LLM calls**: The browser sends generation requests to `/api/llm/proxy`. The server reads `OPENAI_API_KEY` / `OPENAI_BASE_URL` or `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` and calls the upstream API. Keys are never sent to the browser.
- **Offline**: Once loaded, the app works without an internet connection except when generating documents (which requires the LLM API).

## First-time setup

1. Copy `.env.example` to `.env.local`.
2. Set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL`) or `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_BASE_URL`). To use a gateway such as Groq, Moonshot, GLM, or NVIDIA NIM, point `OPENAI_BASE_URL` at it.
3. Restart the dev server.
4. Go to **Settings → LLM Configuration**, select the matching API style (OpenAI-compatible or Anthropic-compatible), and enter a model id.
5. Click **Test Connection**.
6. Start a new project from the Dashboard.

## Data management

- **Export**: Projects can be exported as Markdown files.
- **Persistent**: Data survives browser restarts as long as you don't clear site data.
- **No sync**: There is no cloud sync. To move data to another device, export your projects.
