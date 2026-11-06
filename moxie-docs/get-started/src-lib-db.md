# Runtime data layer: Local-first Dexie vs. optional Drizzle/Postgres

This area defines two parallel persistence paths: a local-first, client-side Dexie/IndexedDB database used by the shipped app routes, and an optional Drizzle/Postgres schema intended for a future/alternative “cloud mode.” This document clarifies which path is authoritative at runtime, how control and data flow through the current app, and what it would take to opt into Postgres-backed mode.

## Architecture

- Entry points
  - Client pages/components under `src/app/...` import from `src/lib/db.ts` to read/write data. These operate entirely in the browser via IndexedDB through Dexie.
  - Drizzle schema and config (`drizzle/schema.ts`, `drizzle.config.ts`) exist for a server-side Postgres deployment path but are not referenced by the current app routes.
- Data flow (current/authoritative)
  - UI → `src/lib/db.ts` helpers → Dexie tables in the user’s browser → persistent IndexedDB storage.
- Data flow (optional/future)
  - UI/server actions/API routes (not present in this repo snapshot) → Drizzle ORM → Postgres using `DATABASE_URL` from the environment.

In production today, the Dexie path is authoritative. Postgres is opt-in infrastructure that requires implementing server-side routes/actions to become active.

## src/lib/db.ts (Dexie/IndexedDB local-first data layer)

Responsibility: Client-side persistence for projects, project sections, LLM config, and export history. This module is directly used by app pages and is the source of truth in the current application runtime.

Key pieces and control flow:
- Database class: `PortforgeDB extends Dexie`
  - Name: `portforge_db`
  - Version 1 stores schema:
    - `projects: 'id, title, template_id, status, updated_at'`
    - `projectSections: 'id, project_id, section_id, order'`
    - `llmConfig: 'id'`
    - `exportHistory: 'id, project_id, format, created_at'`
- Instance: `export const db = new PortforgeDB()`

Project operations:
- `getAllProjects(): Promise<Project[]>`
  - Reads all projects ordered by `updated_at` descending.
- `getProjectById(id: string): Promise<Project | undefined>`
  - Lookup by primary key.
- `createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project>`
  - Generates `id = pf_<timestamp>_<rand>`, sets ISO `created_at`/`updated_at`, inserts.
- `updateProject(id: string, updates: Partial<Project>): Promise<void>`
  - Merges provided fields and always touches `updated_at` with current ISO timestamp.
- `deleteProject(id: string): Promise<void>`
  - Cascades manual cleanup: deletes all `projectSections` and `exportHistory` with matching `project_id`, then deletes the project.

Section operations:
- `getProjectSections(projectId: string): Promise<ProjectSection[]>`
  - Filter by `project_id` and `sortBy('order')`.
- `saveSection(section: ProjectSection): Promise<void>`
  - Upsert via `put`.

LLM config operations:
- `getLLMConfig(): Promise<LLMConfig | null>`
  - Fetches row with `id = 'default'`; returns the config fields (identifier is internal).
- `saveLLMConfig(config: LLMConfig): Promise<void>`
  - Stores config at `id = 'default'`.
- `clearLLMConfig(): Promise<void>`
  - Deletes `id = 'default'`.

Export history operations:
- `addExportRecord(record: Omit<ExportRecord, 'id'>): Promise<void>`
  - Generates `id = exp_<timestamp>_<rand>` and inserts.
- `getExportHistory(projectId: string): Promise<ExportRecord[]>`
  - Filter by `project_id`, `reverse().toArray()`.

Notes and implications:
- Types come from `@/types` and include `Project`, `ProjectSection`, `LLMConfig`, `ExportRecord`. Stored JSON like `project.content` is application-defined.
- All side effects are local to the browser’s IndexedDB. No network or server auth is involved.

## src/app/(dashboard)/project/[id]/page.tsx (Project page using Dexie)

Responsibility: Client-side page that drives the questionnaire → AI generation → review/edit flow for a single project, persisting state in Dexie via `src/lib/db.ts`.

Behavior and data flow:
- Loads project by id (from route param) using `getProjectById(id)`. If not found, redirects to `/dashboard`.
- Loads template by `proj.template_id` via `getTemplateById` (from `@/lib/templates`). If not found, redirects to `/dashboard`.
- Determines initial stage from `proj.content`:
  - If `content.generated` or `content.edited` exist, loads into editor and enters `reviewing`.
  - Otherwise enters `questionnaire`.
- Questionnaire state: `answers` keyed by question id; progresses through `template.question_schema`.
- Generation:
  - Reads provider/model from `localStorage` keys `portforge_provider` (defaults to `'anthropic'`) and `portforge_model` (may be empty), obtains API key via `getStoredApiKey(provider)`.
  - If no API key, sets an error "No API key configured. Go to Settings → LLM Configuration to add your key." and returns to questionnaire.
  - Creates client via `createLLMClient({ provider, model, apiKey })` and streams tokens via `onChunk` into `generatedDoc`.
  - On success, persists with `updateProject(id, { content: { generated: doc, edited: doc }, status: 'complete' })` and enters `reviewing`.
- Rewrite flow:
  - Builds prompt with `buildRegeneratePrompt(editedDoc || generatedDoc, rewriteFeedback)`, streams new content, saves with same `updateProject` call (status `'complete'`).
- Editing:
  - `MarkdownEditor` calls `saveEdited(content)` which updates Dexie with `content: { generated, edited }` and `status: 'complete'`.
- Export:
  - Triggers a local Markdown file download for current `editedDoc || generatedDoc`.

Dependencies and contracts:
- Persists exclusively via `updateProject` in `src/lib/db.ts`; no server calls.
- Reads/writes `project.content` as a JSON object with optional `generated` and `edited` string fields.
- Uses `localStorage` and `@/lib/llm/*` utilities for AI; these are unrelated to Drizzle/Postgres.

Auth/authorization:
- None; page is a `'use client'` component that operates in-browser. Any access control would need to be enforced outside this component.

Notable errors:
- Missing API key: user-facing error messages; generation aborted.
- AI client exceptions: message shown via `setError` and stage reset appropriately.

## drizzle/schema.ts (Drizzle/Postgres schema — optional cloud mode)

Responsibility: Defines Postgres tables and enums for a server-backed deployment using Drizzle ORM. Not used by current app routes.

Schema overview:
- Enums
  - `career_track`: `['cybersecurity', 'software_dev', 'devops_cloud']`
  - `documentation_mode`: `['static', 'integrative']`
  - `project_status`: `['draft', 'complete', 'exported']`
  - `subscription_tier`: `['free', 'pro', 'audit']`
- Tables
  - `profiles`
    - `id` uuid primary key
    - `email` text not null
    - `full_name` text
    - `username` text unique
    - `career_track` enum
    - `documentation_mode` enum default `'static'` not null
    - `subscription_tier` enum default `'free'` not null
    - `portfolio_public` boolean default `true` not null
    - `bio` text
    - `created_at` timestamp defaultNow not null
  - `projects`
    - `id` uuid primary key defaultRandom
    - `user_id` uuid not null references `profiles.id` onDelete `cascade`
    - `title` text not null
    - `career_track` enum not null
    - `template_id` text not null
    - `design_theme` text default `'default'` not null
    - `status` enum default `'draft'` not null
    - `public` boolean default `false` not null
    - `content` jsonb default `{}` not null
    - `created_at` timestamp defaultNow not null
    - `updated_at` timestamp defaultNow not null
  - `ai_sessions`
    - `id` uuid primary key defaultRandom
    - `project_id` uuid not null references `projects.id` onDelete `cascade`
    - `answers` jsonb default `{}` not null
    - `generated_content` text
    - `completed` boolean default `false` not null
    - `created_at` timestamp defaultNow not null

Runtime implications:
- The Postgres-side `projects.content` JSON shape is compatible in spirit with the Dexie usage (`generated`/`edited` strings), but you must enforce this at the app layer.
- Referential integrity exists (`projects.user_id`, `ai_sessions.project_id`) which you must satisfy in any migration from local to cloud.

## drizzle.config.ts (Drizzle tooling config)

Responsibility: Configures Drizzle Kit to generate and run migrations for Postgres.

- `schema: './drizzle/schema.ts'`
- `out: './drizzle/migrations'`
- `dialect: 'postgresql'`
- `dbCredentials: { url: process.env.DATABASE_URL! }`

Operational notes:
- Requires `DATABASE_URL` to be set in the environment when running Drizzle tooling.
- This file does not affect the running app unless you add server code that uses Drizzle.

## Opting into “cloud mode” (Postgres) — what’s missing and how to proceed

Today, no page or API route imports Drizzle or connects to Postgres. To enable cloud mode:
- Introduce server-side entry points (Next.js Route Handlers or Server Actions) that:
  - Authenticate the user and determine `profiles.id` for multi-tenant data.
  - Implement CRUD that mirrors `src/lib/db.ts` behavior against the Drizzle schema.
  - Serialize/deserialize `projects.content` consistently with the current Dexie shape.
- Replace or conditionally switch client calls from `src/lib/db.ts` to server calls. For example, gate on an environment flag and expose a unified data access layer that delegates to Dexie (local) or fetch (server/Drizzle).
- Provide a migration/import path from IndexedDB to Postgres if you need to move existing local data for a user.

Until such server routes exist and are wired, Dexie/IndexedDB is the sole authoritative runtime path.

## Gotchas

- Authoritative path: The app pages depend on `src/lib/db.ts`. Adding Drizzle tables or running migrations does nothing for the user experience unless you wire server code and switch the data access layer.
- Timestamp semantics: `updateProject` in Dexie always overwrites `updated_at` with `new Date().toISOString()`. If you mirror this in Postgres, ensure `updated_at` is updated consistently (e.g., trigger or explicit update) to preserve ordering parity with `getAllProjects().orderBy('updated_at').reverse()`.
- Content shape: The UI expects `project.content` to possibly include `{ generated: string, edited: string }`. Keep this contract stable across both Dexie and Postgres.
- Deletion cascade: Dexie manually deletes `projectSections` and `exportHistory` before removing a project. If you introduce server-backed sections/history, enforce cascading deletes at the DB level or in your service layer to avoid orphaned records.
- Local storage dependency: The project page reads `localStorage` keys `portforge_provider` and `portforge_model` and uses `getStoredApiKey(provider)`. Cloud mode does not change this; API keys remain client-managed unless you redesign auth/secrets handling.