# Portforge Cyber

> **AI-powered, professional security documentation — right from your browser.**

Portforge is an open-source, local-first tool for creating professional security documentation: penetration test reports, CTF write-ups, lab walkthroughs, and product/company docs. It supports multiple LLM providers (BYO API key), includes a CVSS v3.1 calculator, and can run entirely in the browser (IndexedDB) or be extended with Supabase for cloud-backed workflows.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-38bdf8" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Local-First)](#quick-start-local-first)
- [Optional: Cloud-Backed Setup](#optional-cloud-backed-setup)
- [Project Structure](#project-structure)
- [Configuration & API Keys](#configuration--api-keys)
- [Available Scripts](#available-scripts)
- [LLM Providers](#llm-providers)
- [CVSS v3.1 Calculator](#cvss-v31-calculator)
- [Database Schema](#database-schema)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support & Resources](#support--resources)

---

## Features

### 🔒 Privacy-First
- All data stored locally via **IndexedDB (Dexie.js)** — no server required
- API keys stored in browser `localStorage`, never touch our servers
- Fully offline-capable once loaded

### 🤖 Multi-Model LLM Support
- Adapters for **Anthropic, OpenAI, Google, NVIDIA NIM, Groq, Moonshot, Z-ai (GLM), Minimax**
- Bring your own API key (BYOAK)
- Per-provider model selection with descriptions
- Test connection before committing

### 📝 Templates
- Ready-made cybersecurity templates:
  - **Pentest Reports** — structured vulnerability assessments
  - **CTF Write-ups** — step-by-step capture-the-flag documentation
  - **Lab Walkthroughs** — hands-on security lab guides
- Track-scoped templates (cybersecurity, software dev, devops/cloud)

### 🎯 CVSS v3.1 Calculator
- Built-in **CVSS v3.1** scoring per FIRST.org specification
- Severity badges (Critical / High / Medium / Low / None)
- Color-coded risk indicators
- Quick presets for common scenarios

### 📤 Export
- **Markdown export** — universal, version-control friendly
- PDF export (planned / available in paid tiers in some forks)
- Export history tracking per project

### ☁️ Optional Supabase Integration
- Server-side schema with **Drizzle ORM**
- Row Level Security (RLS) policies
- Streaming AI endpoints for hosted deployments
- Authentication (email/password with confirmation)
- PostgreSQL database with connection pooling

---

## Screenshots

| Landing Page | Dashboard | CVSS Calculator |
|:------------:|:---------:|:---------------:|
| *(coming soon)* | *(coming soon)* | *(coming soon)* |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | [Next.js](https://nextjs.org/) | 15 (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) | 5 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4 |
| Font | [Geist](https://vercel.com/font) | 1.3 |
| Local DB | [Dexie.js](https://dexie.org/) (IndexedDB) | 4 |
| Optional Server DB | [Supabase](https://supabase.com/) (Postgres) | — |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) | — |
| LLM Integrations | Anthropic / OpenAI / Google / NVIDIA / Groq / Moonshot / Z-ai / Minimax | — |

---

## Prerequisites

- **Node.js** 18+ (or compatible LTS)
- **npm** or **pnpm**
- (Optional) **Supabase** account for cloud-backed mode

---

## Quick Start (Local-First)

The fastest way to get started — no database or auth required.

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Open your browser

Navigate to [http://localhost:3000](http://localhost:3000)

### 4. Configure your LLM

1. Go to **Settings → LLM Configuration**
2. Select your preferred provider (e.g., Anthropic, OpenAI, Groq)
3. Paste your API key (stored locally in your browser)
4. Click **Test Connection**
5. Start a new project from the Dashboard

---

## Optional: Cloud-Backed Setup

For hosted deployments with authentication, cloud storage, and streaming AI endpoints, follow the detailed setup in [SETUP.md](SETUP.md).

### High-Level Steps

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Copy `.env.example` to `.env.local`** and fill in your Supabase credentials
3. **Push the database schema:**
   ```bash
   npm run db:push
   ```
4. **Run the auto-profile SQL trigger** in the Supabase SQL Editor
5. **Enable Row Level Security (RLS)** using the policies in [SETUP.md](SETUP.md)
6. **Configure email auth** (optionally disable confirmation for local dev)
7. **Run the dev server:**
   ```bash
   npm run dev
   ```

> 📄 See [SETUP.md](SETUP.md) for the complete step-by-step guide.

---

## Project Structure

```
portforge/
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── AGENTS.md                   # AI agent rules
├── CLAUDE.md                   # Claude-specific instructions
├── company_schema.sql          # Additional SQL for company docs feature
├── drizzle.config.ts           # Drizzle ORM configuration
├── drizzle/
│   ├── .gitkeep
│   └── schema.ts               # Database schema (profiles, projects, ai_sessions)
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts               # Next.js configuration
├── next-env.d.ts               # Next.js TypeScript declarations
├── package.json                 # Dependencies and scripts
├── package-lock.json
├── postcss.config.mjs          # PostCSS configuration
├── README.md                    # This file
├── SETUP.md                     # Detailed cloud setup guide
├── SETUP_LOCAL_FIRST.md         # Local-first quick guide
├── LLM_PROVIDERS.md            # LLM provider guide
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── public/                     # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── src/
    ├── app/
    │   ├── (dashboard)/        # Dashboard group routes
    │   │   ├── layout.tsx      # Dashboard layout
    │   │   ├── dashboard/      # Dashboard home
    │   │   └── project/        # Project creation & editor
    │   ├── page.tsx            # Landing page
    │   ├── layout.tsx           # Root layout
    │   ├── globals.css          # Global styles & CSS variables
    │   └── favicon.ico
    ├── components/             # Reusable UI components
    ├── hooks/                  # Custom React hooks
    ├── types/
    │   └── index.ts             # TypeScript types & interfaces
    └── lib/
        ├── db.ts               # Dexie.js local database client
        ├── utils.ts            # Utility functions (cn, formatDate, etc.)
        ├── cvss/
        │   └── calculator.ts   # CVSS v3.1 calculator
        ├── llm/
        │   ├── client.ts       # LLM client
        │   ├── config.ts       # Provider configurations & models
        │   └── providers.ts    # Provider-specific implementations
        ├── parsers/            # Input parsers (Nmap, Burp, etc.)
        ├── pdf/                # PDF generation utilities
        ├── prompts/
        │   └── index.ts        # AI prompt templates
        └── templates/
            ├── .gitkeep
            └── index.ts        # Template definitions
```

---

## Configuration & API Keys

### Local LLM Usage
- Open the app → **Settings → LLM Configuration**
- Save provider API keys in the browser (`localStorage`)
- Keys never leave your device

### Hosted Deployments
- Copy `.env.example` to `.env.local`
- Populate with your Supabase and LLM credentials
- See [SETUP.md](SETUP.md) for detailed environment variable instructions

### Environment Variables

```bash
# Supabase (cloud mode only)
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key
DATABASE_URL=                    # Postgres connection string (Transaction pooler)

# LLM (cloud mode only — local uses browser storage)
ANTHROPIC_API_KEY=               # console.anthropic.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: GitHub PAT for future PR sync integration
# GITHUB_TOKEN=
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## LLM Providers

Portforge supports the following LLM providers out of the box:

| Provider | Models | Get API Key |
|----------|--------|-------------|
| **Anthropic Claude** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo | [platform.openai.com](https://platform.openai.com) |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash | [aistudio.google.com](https://aistudio.google.com) |
| **NVIDIA NIM** | Mixtral 8x7B, Llama 3.1 series | [build.nvidia.com](https://build.nvidia.com) |
| **Groq** | Mixtral 8x7B, Llama 3 70B, Llama 3 8B | [console.groq.com](https://console.groq.com) |
| **Moonshot (Kimi)** | Moonshot v1 8K / 32K / 128K | [platform.moonshot.cn](https://platform.moonshot.cn) |
| **Z-ai (GLM)** | GLM-4 Flash, GLM-4 Plus | [open.bigmodel.cn](https://open.bigmodel.cn) |
| **Minimax** | MiniMax-01, MiniMax Text-01 | [platform.minimaxi.com](https://platform.minimaxi.com) |

> **Note:** API keys are stored locally in your browser. We do not provide LLM access — you bring your own key.

See [LLM_PROVIDERS.md](LLM_PROVIDERS.md) for provider-specific notes and custom endpoint configuration.

---

## CVSS v3.1 Calculator

Portforge includes a built-in **CVSS v3.1 Base Score Calculator** compliant with the [FIRST.org specification](https://www.first.org/cvss/v3.1/specification-document).

### Features
- Full metric scoring: AV, AC, PR, UI, S, C, I, A
- Severity ratings: **Critical (9.0–10.0)**, **High (7.0–8.9)**, **Medium (4.0–6.9)**, **Low (0.1–3.9)**, **None (0.0)**
- Color-coded severity badges
- Vector string generation (`CVSS:3.1/AV:...`)
- Quick presets for rapid assessment
- Vector-to-metrics parser for importing existing scores

---

## Database Schema

### Local (IndexedDB via Dexie.js)
- **projects** — Project metadata and content
- **projectSections** — Per-section content
- **llmConfig** — Saved LLM configuration
- **exportHistory** — Export log per project

### Cloud (PostgreSQL via Supabase + Drizzle)
See `drizzle/schema.ts` for full schema definitions.

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup) |
| `projects` | Project data with JSONB content |
| `ai_sessions` | AI questionnaire answers & generated content |

For company documentation support, see `company_schema.sql`.

---

## Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| Local-first mode | ✅ Ready | IndexedDB via Dexie.js |
| Multi-model LLM support | ✅ Ready | 8 providers, BYO API key |
| CVSS v3.1 calculator |embroidered| Built-in scoring & badges |
| Markdown export | ✅ Ready | Per-project export |
| Supabase cloud mode | ✅ Ready | Auth, RLS, streaming AI |
| PDF export | 🚧 Planned | React-PDF + serverless function |
| Integrative Mode | 🚧 Planned | GitHub OAuth + Nmap/Burp XML parsers |
| LemonSqueezy payments | 🚧 Planned | Pro + Audit Mode subscription gates |
| Public portfolio page | 🚧 Planned | Shareable `/u/[username]` page |
| Rich markdown editor | 🚧 Planned | Replace plain textarea |

---

## Contributing

Contributions are welcome and appreciated!

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Guidelines
- Ensure TypeScript compiles without errors
- Run `npm run lint` before submitting
- Keep changes focused and well-documented
- Update relevant documentation if needed

---

## License

[MIT](LICENSE) — see the LICENSE file for details.

---

## Support & Resources

- **Primary Setup Guide:** [SETUP.md](SETUP.md)
- **Local-First Quick Guide:** [SETUP_LOCAL_FIRST.md](SETUP_LOCAL_FIRST.md)
- **LLM Provider Guide:** [LLM_PROVIDERS.md](LLM_PROVIDERS.md)
- **Issues & Bugs:** [GitHub Issues](https://github.com/Macanthony7/Portforge/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Macanthony7/Portforge/discussions)

---

<p align="center">
  Built with ❤️ for the security community.<br/>
  <strong>Document your craft.</strong>
</p>
