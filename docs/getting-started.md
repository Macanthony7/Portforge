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

Portforge does not provide LLM access — you bring your own API key (BYOAK). Keys are stored in your browser's `localStorage` and never sent to any Portforge server.

### Steps

1. Navigate to **Settings** from the dashboard sidebar (or go to `/dashboard/settings`).
2. Select your **LLM Provider** from the dropdown (e.g., Groq, OpenAI, Anthropic).
3. Select a **Model** for that provider.
4. Paste your **API Key** into the key field.
5. Click **Test Connection** — you should see a success indicator.
6. Click **Save**.

Your key is now stored locally and will be used for all document generation in this browser session.

### Recommended Free Options

If you don't have an API key yet, these providers offer free tiers:

| Provider | Free Tier | Get Key |
|----------|-----------|---------|
| Groq | Yes — fast inference | [console.groq.com](https://console.groq.com) |
| Google Gemini | Yes — generous limits | [aistudio.google.com](https://aistudio.google.com) |
| NVIDIA NIM | Yes — credits on signup | [build.nvidia.com](https://build.nvidia.com) |

See [LLM Providers](./llm-providers.md) for the full list and per-provider notes.

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

### "LLM request failed: 401"
Your API key is invalid or expired. Go to **Settings** and re-enter your key, then test the connection again.

### "LLM request failed: 429"
You've hit your provider's rate limit. Wait a moment and try again, or switch to a different model/provider.

### "No response body"
The provider returned an empty response. This is usually a transient error — retry the generation.

### The app is blank after loading
Clear your browser's site data for `localhost:3000` and reload. This can happen if IndexedDB gets into a bad state during development.

### Changes aren't persisting
Portforge uses IndexedDB. Make sure you're not in a private/incognito window, as some browsers restrict IndexedDB storage in private mode.
