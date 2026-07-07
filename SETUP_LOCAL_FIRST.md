# Portforge Cyber — Local-First Setup

Portforge Cyber is a fully client-side application. No server or database is required.

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
- **LLM calls**: API requests go directly from your browser to the LLM provider you configure. Your API key never touches our servers.
- **Offline**: Once loaded, the app works without an internet connection except when generating documents (which requires the LLM API).

## First-time setup

1. Go to **Settings → LLM Configuration**
2. Select your preferred LLM provider (e.g. Anthropic, OpenAI, Groq)
3. Paste your API key (stored locally in your browser)
4. Click **Test Connection**
5. Start a new project from the Dashboard

## Data management

- **Export**: Projects can be exported as Markdown files.
- **Persistent**: Data survives browser restarts as long as you don't clear site data.
- **No sync**: There is no cloud sync. To move data to another device, export your projects.
