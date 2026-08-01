# Contributing to Portforge

Thanks for your interest in contributing! This guide covers everything you need to know to get your development environment set up, understand the codebase, and submit a quality pull request.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Key Conventions](#key-conventions)
- [Common Contribution Areas](#common-contribution-areas)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Project Structure

```
portforge/
├── doc/                        # ← You are here
├── drizzle/
│   └── schema.ts               # Cloud DB schema (Drizzle ORM)
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # All authenticated/dashboard routes
│   │   │   ├── layout.tsx      # Dashboard shell layout
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx    # Project list
│   │   │   │   ├── new/        # New project wizard
│   │   │   │   └── settings/   # LLM settings
│   │   │   └── project/[id]/   # Project editor
│   │   ├── api/llm/proxy/      # Server-side LLM proxy
│   │   ├── page.tsx            # Landing page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── cvss/               # CVSS calculator components
│   │   ├── editor/             # Editor-specific components
│   │   ├── landing/            # Landing page sections
│   │   ├── layout/             # Navbar, ThemeToggle
│   │   └── ui/                 # Shared UI (MarkdownEditor, MarkdownRenderer)
│   ├── lib/
│   │   ├── cvss/calculator.ts  # Pure CVSS v3.1 logic
│   │   ├── db.ts               # Dexie.js IndexedDB client
│   │   ├── llm/
│   │   │   ├── client.ts       # LLMClient class
│   │   │   ├── config.ts       # Provider configs + localStorage helpers
│   │   │   └── providers.ts    # Per-provider adapters
│   │   ├── prompts/index.ts    # AI prompt builders
│   │   ├── templates/index.ts  # Template + theme definitions
│   │   └── utils.ts            # cn(), formatDate(), etc.
│   └── types/index.ts          # All TypeScript types
```

---

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/Portforge.git
cd Portforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

No `.env` file is needed for local development. The app runs fully in the browser.

### 4. Lint before committing

```bash
npm run lint
```

Fix any errors before opening a PR. The CI pipeline will reject PRs with lint failures.

---

## Architecture Overview

Portforge follows a clean layered architecture:

```
UI (app/ + components/)
    ↓ calls
lib/ (db, llm, cvss, templates, prompts)
    ↓ calls
Browser APIs (IndexedDB, localStorage, fetch)
    ↓ or
/api/llm/proxy (Next.js Route Handler)
    ↓ calls
Upstream LLM Provider APIs
```

### Key Design Decisions

**Local-first by default.** All data lives in IndexedDB via Dexie.js. No auth, no server, no database required to run the app.

**Browser → proxy → LLM.** The browser never calls LLM APIs directly. All requests go through `/api/llm/proxy` to keep API keys out of browser network logs.

**Provider adapters.** Each LLM provider is a `ProviderAdapter` object with a consistent interface (`endpoint`, `headers`, `body`, `parseStream`, `testBody`, `parseTest`). Adding a provider means adding one object — no changes to `LLMClient`.

**Templates are data.** Templates and design themes are plain TypeScript objects in `src/lib/templates/index.ts`. No database or CMS required to add a new template.

---

## Key Conventions

### TypeScript

- All types live in `src/types/index.ts`. Don't scatter interfaces across files.
- Use `interface` for object shapes, `type` for unions and aliases.
- Avoid `any`. Use `unknown` and narrow with type guards.

### Components

- One component per file. File name matches the component name in kebab-case.
- Use Tailwind CSS for all styling. The design token palette is in `tailwind.config.ts` under `forge.*`.
- Keep components focused — if a component is doing too much, split it.

### Database

- All IndexedDB operations go through the functions in `src/lib/db.ts`. Don't access `db` directly from components.
- IDs are generated in the DB layer, not in components.

### LLM

- All LLM calls go through `LLMClient`. Don't call `fetch` to LLM APIs directly from components.
- Prompt construction belongs in `src/lib/prompts/index.ts`.

### Naming

- React components: `PascalCase`
- Functions and variables: `camelCase`
- Files: `kebab-case.tsx` for components, `camelCase.ts` for lib files
- Constants: `UPPER_SNAKE_CASE`

---

## Common Contribution Areas

### Adding a New Template

1. Open `src/lib/templates/index.ts`.
2. Add a new object to the `TEMPLATES` array following the `Template` interface.
3. Define `question_schema` (the questionnaire) and `output_structure` (the document sections).
4. The template will appear automatically in the new project wizard.

### Adding a New LLM Provider

See [LLM Providers — Adding a New Provider](./llm-providers.md#adding-a-new-provider).

### Adding a New Design Theme

1. Open `src/lib/templates/index.ts`.
2. Add a new object to the `DESIGN_THEMES` array following the `DesignTheme` interface.

### Improving the CVSS Calculator

The calculator logic is in `src/lib/cvss/calculator.ts`. It's a pure function with no side effects — easy to test and modify. The UI components are in `src/components/cvss/`.

### Adding Export Formats

The export logic lives in `src/app/(dashboard)/project/[id]/page.tsx` in the `handleExportMd` function. PDF export is planned — see the roadmap in the README.

### Improving Prompts

Prompt templates are in `src/lib/prompts/index.ts`. The two functions are `buildDocumentPrompt` (initial generation) and `buildRegeneratePrompt` (rewrite). Improving these directly improves output quality for all users.

---

## Submitting a Pull Request

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes.** Keep the scope focused — one feature or fix per PR.

3. **Run lint:**
   ```bash
   npm run lint
   ```

4. **Verify the build:**
   ```bash
   npm run build
   ```

5. **Commit with a clear message:**
   ```bash
   git commit -m "feat: add Ollama provider adapter"
   ```

6. **Push and open a PR** against the `main` branch on GitHub.

### PR Checklist

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Changes are focused and well-scoped
- [ ] Relevant documentation updated (this `doc/` folder or README)
- [ ] No hardcoded API keys, credentials, or PII

### Commit Message Format

Use conventional commits where possible:

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change with no feature/fix |
| `style:` | Formatting, whitespace |
| `chore:` | Build, deps, config |
