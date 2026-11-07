# Getting Started with Portforge

Portforge is a local-first, AI-powered tool for creating professional security documentation — pentest reports, CTF write-ups, and lab walkthroughs. This guide walks you through everything from installation to your first generated document.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Configuring Your LLM](#configuring-your-llm)
- [Creating Your First Project](#creating-your-first-project)
- [Using the Editor](#using-the-editor)
- [Exporting Your Document](#exporting-your-document)
- [Optional: Cloud-Backed Mode](#optional-cloud-backed-mode)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | LTS recommended |
| npm or pnpm | any recent | npm ships with Node |
| A browser | modern | Chrome, Firefox, Edge, Safari |
| An LLM API key | — | See [LLM Providers](./llm-providers.md) |

You do **not** need a database, a server, or a Supabase account to run Portforge locally. Everything is stored in your browser's IndexedDB.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Macanthony7/Portforge.git
cd Portforge
```

### 2. Install dependencies

```bash
npm install
```

That's it. No `.env` file is required for local-first mode.

---

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the Portforge landing page.

> **Note:** The dev server uses Next.js Turbopack for fast hot-reloading. The first startup may take a few seconds while it compiles.

---

## Configuring Your LLM

Portforge talks to LLMs through two API styles, both configured with server-only environment variables. The browser never receives a key.

| Style | Key env var | Base URL env var |
|-------|-------------|------------------|
| OpenAI-compatible | `OPENAI_API_KEY` | `OPENAI_BASE_URL` |
| Anthropic-compatible | `ANTHROPIC_API_KEY` | `ANTHROPIC_BASE_URL` |

### Steps

1. Copy `.env.example` to `.env.local`.
2. Set the key for the style you use. To use a gateway (Groq, Moonshot, GLM, NVIDIA NIM, a local server), also set the base URL — for example `OPENAI_BASE_URL=https://api.groq.com/openai/v1`.
3. Restart the dev server.
4. Navigate to **Settings** from the dashboard sidebar (or go to `/dashboard/settings`).
5. Select the **API style** and enter a model id (suggestions are offered for each style).
6. Click **Test Connection** — you should see a success indicator.

The selected style and model are saved in your browser; the key stays on the server.

### Recommended Free Options

If you don't have an API key yet, these providers offer free tiers and OpenAI-compatible endpoints:

| Provider | Free Tier | Get Key |
|----------|-----------|---------|
| Groq | Yes — fast inference | [console.groq.com](https://console.groq.com) |
| NVIDIA NIM | Yes — credits on signup | [build.nvidia.com](https://build.nvidia.com) |

Use them with the OpenAI-compatible style and the provider's base URL in `OPENAI_BASE_URL`.

See [LLM Providers](./llm-providers.md) for per-style notes and gateway URLs.

---

## Creating Your First Project

1. From the dashboard, click **New Project**.
2. Enter a **project title** (e.g., "HackTheBox — Lame Walkthrough").
3. Select a **template**:
   - **CTF Write-up** — for Capture The Flag challenges
   - **Vulnerability Audit Report** — for pentest engagements
   - **Security Lab Documentation** — for TryHackMe/HTB rooms
4. Choose a **design theme** (Dark Terminal, Forge Dark, or Audit Light).
5. Click **Create Project**.

You'll be taken to the project questionnaire.

---

## Using the Editor

The project editor is a multi-step questionnaire. Each step corresponds to a section of your final document.

### Answering Questions

- Fill in each field as thoroughly as possible — the AI uses your answers directly.
- Fields marked **required** must be filled before you can proceed.
- For **code** fields, paste raw code or commands — they'll be wrapped in code blocks automatically.
- For **list** fields, enter one item per line (e.g., tools used).
- For **CVSS table** fields, use the built-in CVSS calculator (see [CVSS Calculator](./cvss-calculator.md)).

### Generating the Document

Once all required questions are answered, click **Generate Document**. The AI will stream the full document in real time into the editor.

### Rewriting Sections

If you're not happy with the output:

1. Click **Rewrite** in the editor toolbar.
2. Type your feedback (e.g., "Make the executive summary shorter and less technical").
3. Click **Submit** — the AI rewrites the entire document based on your instructions.

### Manual Editing

You can edit the generated markdown directly in the editor at any time. Changes are saved automatically to IndexedDB.

---

## Exporting Your Document

Click the **Export Markdown** button in the editor toolbar. A `.md` file will be downloaded to your machine.

The export is logged in the project's export history, which you can view from the dashboard.

> **PDF export** is planned for a future release.

---

## Optional: Cloud-Backed Mode

For multi-device access, authentication, and hosted deployments, Portforge supports Supabase as a backend. See [Cloud Setup](./cloud-setup.md) for the full guide.

---

## Troubleshooting

### Missing API key
The proxy reports which env var is unset (for example `OPENAI_API_KEY`). Set it in the server environment and restart the dev server.

### "LLM request failed: 401"
The server-side API key is invalid or expired. Update `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, restart the server, and test the connection again.

### "LLM request failed: 429"
You've hit your provider's rate limit. Wait a moment and try again, or switch to a different model/provider.

### "No response body"
The provider returned an empty response. This is usually a transient error — retry the generation.

### The app is blank after loading
Clear your browser's site data for `localhost:3000` and reload. This can happen if IndexedDB gets into a bad state during development.

### Changes aren't persisting
Portforge uses IndexedDB. Make sure you're not in a private/incognito window, as some browsers restrict IndexedDB storage in private mode.
