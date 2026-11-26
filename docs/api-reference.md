# API Reference

This document covers all internal APIs, library functions, and the server-side proxy endpoint exposed by Portforge.

---

## Table of Contents

- [LLM Proxy Endpoint](#llm-proxy-endpoint)
- [LLMClient](#llmclient)
- [Database API (db.ts)](#database-api-dbts)
- [CVSS Calculator](#cvss-calculator)
- [Templates API](#templates-api)
- [Prompts API](#prompts-api)
- [LLM Config Helpers](#llm-config-helpers)
- [Provider Adapters](#provider-adapters)
- [TypeScript Types](#typescript-types)

---

## LLM Proxy Endpoint

### `POST /api/llm/proxy`

A server-side proxy that forwards LLM requests to the upstream provider. All browser-side LLM calls route through this endpoint to avoid exposing API keys in client-side network traffic.

The two supported styles are **OpenAI-compatible** (`provider: "openai"`) and **Anthropic-compatible** (`provider: "anthropic"`).

#### Request Body

```ts
{
  provider: LLMProvider        // required — "openai" or "anthropic"
  model: string                // required — the model id to request
  prompt?: string              // required unless test: true
  maxTokens?: number           // default: 4096
  test?: boolean               // default: false — if true, sends a minimal test message
}
```

#### API Key Resolution

The proxy resolves the key and base URL only from the server environment:

1. `provider: "openai"` uses `OPENAI_API_KEY` and `OPENAI_BASE_URL` (default `https://api.openai.com/v1`).
2. `provider: "anthropic"` uses `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` (default `https://api.anthropic.com/v1`).

A body-supplied key, the `Authorization` request header and any client-supplied endpoint are ignored. If the selected style's key env var is missing, the proxy returns `400` with a message naming that variable.

#### Optional Proxy Secret

Set `PROXY_SECRET` in your environment to require all proxy requests to include the header `x-proxy-secret: <your-secret>`. Requests without it receive `403`. This is useful for hosted deployments to prevent unauthorized use.

#### Response

The proxy streams the upstream provider's response body directly to the client, preserving all headers and status codes.

#### Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Invalid or missing `provider`/`model`, missing `prompt`, or missing server API key |
| `403` | Invalid or missing `x-proxy-secret` |
| `500` | Unexpected server error |

---

## LLMClient

**File:** `src/lib/llm/client.ts`

The main class for interacting with LLM providers. Instantiate it with an `LLMConfig` object. Every request goes to `/api/llm/proxy`; the browser never sends a key.

### `createLLMClient(config: LLMConfig): LLMClient`

Factory function — preferred way to create a client.

```ts
import { createLLMClient } from '@/lib/llm/client'

const client = createLLMClient({
  provider: 'openai',
  model: 'gpt-4o',
})
```

---

### `LLMClient.generateText(options: GenerateOptions): Promise<string>`

Generates text and returns the full response as a string. Streams internally and calls `onChunk` for each token if provided.

#### `GenerateOptions`

```ts
interface GenerateOptions {
  prompt: string
  maxTokens?: number           // default: 4096
  onChunk?: (chunk: string) => void  // called with each streamed token
}
```

#### Example

```ts
const text = await client.generateText({
  prompt: 'Write a pentest executive summary for a web application assessment.',
  maxTokens: 2048,
  onChunk: (chunk) => process.stdout.write(chunk),
})
```

---

### `LLMClient.streamText(options: GenerateOptions): AsyncGenerator<string>`

An async generator that yields tokens one at a time as they stream from the provider.

#### Example

```ts
for await (const token of client.streamText({ prompt: 'Explain SQL injection.' })) {
  process.stdout.write(token)
}
```

---

### `LLMClient.testConnection(): Promise<{ success: boolean; error?: string }>`

Sends a minimal test message to the provider to verify the API key and model are valid.

#### Example

```ts
const result = await client.testConnection()
if (!result.success) {
  console.error('Connection failed:', result.error)
}
```

---

## Database API (db.ts)

**File:** `src/lib/db.ts`

All local storage operations use [Dexie.js](https://dexie.org/) over IndexedDB. The database is named `portforge_db`.

### Projects

#### `getAllProjects(): Promise<Project[]>`

Returns all projects ordered by `updated_at` descending.

#### `getProjectById(id: string): Promise<Project | undefined>`

Returns a single project by its ID, or `undefined` if not found.

#### `createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project>`

Creates a new project. Auto-generates `id` (format: `pf_<timestamp>_<random>`), `created_at`, and `updated_at`.

```ts
const project = await createProject({
  title: 'My Pentest Report',
  career_track: 'cybersecurity',
  template_id: 'cyber-pentest-report',
  design_theme: 'cyber-forge-dark',
  status: 'draft',
  public: false,
  content: {},
})
```

#### `updateProject(id: string, updates: Partial<Project>): Promise<void>`

Updates a project. Always sets `updated_at` to the current timestamp.

#### `deleteProject(id: string): Promise<void>`

Deletes a project and all its associated sections and export history records.

---

### Sections

#### `getProjectSections(projectId: string): Promise<ProjectSection[]>`

Returns all sections for a project, sorted by `order` ascending.

#### `saveSection(section: ProjectSection): Promise<void>`

Upserts a section (insert or replace by `id`).

---

### LLM Config

#### `getLLMConfig(): Promise<LLMConfig | null>`

Returns the saved LLM configuration, or `null` if none is saved.

#### `saveLLMConfig(config: LLMConfig): Promise<void>`

Saves the LLM configuration under the key `"default"`.

#### `clearLLMConfig(): Promise<void>`

Deletes the saved LLM configuration.

---

### Export History

#### `addExportRecord(record: Omit<ExportRecord, 'id'>): Promise<void>`

Logs an export event. Auto-generates `id` (format: `exp_<timestamp>_<random>`).

#### `getExportHistory(projectId: string): Promise<ExportRecord[]>`

Returns all export records for a project in reverse chronological order.

---

## CVSS Calculator

**File:** `src/lib/cvss/calculator.ts`

A pure TypeScript implementation of the CVSS v3.1 Base Score specification from [FIRST.org](https://www.first.org/cvss/v3.1/specification-document).

### `calculateCVSS(metrics: CVSSMetrics): CVSSResult`

Calculates the CVSS base score from a set of metrics.

#### `CVSSMetrics`

```ts
interface CVSSMetrics {
  AV: 'N' | 'A' | 'L' | 'P'   // Attack Vector: Network, Adjacent, Local, Physical
  AC: 'L' | 'H'                // Attack Complexity: Low, High
  PR: 'N' | 'L' | 'H'         // Privileges Required: None, Low, High
  UI: 'N' | 'R'                // User Interaction: None, Required
  S:  'U' | 'C'                // Scope: Unchanged, Changed
  C:  'N' | 'L' | 'H'         // Confidentiality Impact: None, Low, High
  I:  'N' | 'L' | 'H'         // Integrity Impact: None, Low, High
  A:  'N' | 'L' | 'H'         // Availability Impact: None, Low, High
}
```

#### `CVSSResult`

```ts
interface CVSSResult {
  score: number                                          // 0.0 – 10.0
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None'
  vector: string                                         // e.g. "CVSS:3.1/AV:N/AC:L/..."
  color: string                                          // hex color for the severity
  colorClass: string                                     // Tailwind CSS class
}
```

#### Example

```ts
import { calculateCVSS } from '@/lib/cvss/calculator'

const result = calculateCVSS({
  AV: 'N', AC: 'L', PR: 'N', UI: 'N',
  S: 'U', C: 'H', I: 'H', A: 'H',
})
// result.score    → 9.8
// result.severity → "Critical"
// result.vector   → "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
```

---

### `vectorToMetrics(vector: string): CVSSMetrics | null`

Parses a CVSS v3.1 vector string back into a `CVSSMetrics` object. Returns `null` if the string is invalid.

```ts
import { vectorToMetrics } from '@/lib/cvss/calculator'

const metrics = vectorToMetrics('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')
// metrics.AV → "N", metrics.C → "H", etc.
```

---

### `QUICK_PRESETS`

An exported array of four preset metric configurations for rapid scoring:

| Name | Score | Severity |
|------|-------|----------|
| Critical | 9.8 | Critical |
| High | 8.1 | High |
| Medium | 5.0 | Medium |
| Low | 1.6 | Low |

---

## Templates API

**File:** `src/lib/templates/index.ts`

### `getTemplatesByTrack(): Template[]`

Returns all available templates (currently all are `cybersecurity` track).

### `getTemplateById(id: string): Template | undefined`

Returns a template by its ID, or `undefined` if not found.

#### Available Template IDs

| ID | Name |
|----|------|
| `cyber-ctf-writeup` | CTF Write-up |
| `cyber-pentest-report` | Vulnerability Audit Report |
| `cyber-lab-doc` | Security Lab Documentation |

### `getThemesByTrack(): DesignTheme[]`

Returns all available design themes.

#### Available Theme IDs

| ID | Name |
|----|------|
| `cyber-dark-terminal` | Dark Terminal |
| `cyber-forge-dark` | Forge Dark |
| `cyber-audit-light` | Audit Light |

---

## Prompts API

**File:** `src/lib/prompts/index.ts`

### `buildDocumentPrompt(template: Template, answers: Record<string, string>): string`

Builds the full system + user prompt sent to the LLM for initial document generation.

- `template` — the selected `Template` object
- `answers` — a map of question `id` → user's answer string

Returns a complete prompt string ready to pass to `LLMClient.generateText`.

---

### `buildRegeneratePrompt(currentContent: string, userFeedback: string): string`

Builds the rewrite prompt when a user requests changes to an already-generated document.

- `currentContent` — the current markdown document
- `userFeedback` — the user's rewrite instructions

Returns a prompt that instructs the LLM to rewrite the entire document based on the feedback.

---

## LLM Config Helpers

**File:** `src/lib/llm/config.ts`

These helpers expose non-secret style metadata. No helper reads or writes a credential.

### `PROVIDER_CONFIGS`

A style-keyed table holding each style's display label, API-key env var name, base-URL env var name, default base URL, and suggested model ids.

### `getProviderName(provider: LLMProvider): string`

Returns the display label for a style (e.g. `"OpenAI-compatible"`).

### `getSuggestedModels(provider: LLMProvider): string[]`

Returns the suggested model ids for a style. Any model id can still be entered in Settings.

---

## Provider Adapters

**File:** `src/lib/llm/providers.ts`

Each LLM provider is implemented as a `ProviderAdapter` object. You generally don't call these directly — `LLMClient` uses them internally.

### `ProviderAdapter` Interface

```ts
interface ProviderAdapter {
  endpoint: (baseUrl: string) => string
  headers: (apiKey: string) => Record<string, string>
  body: (prompt: string, model: string, maxTokens: number) => unknown
  parseStream: (line: string) => StreamChunk | null
  testBody: (model: string) => unknown
}
```

Each adapter appends its style path to the server-supplied base URL: `/chat/completions` for `openai`, `/messages` for `anthropic`.

### `getAdapter(provider: LLMProvider): ProviderAdapter`

Returns the adapter for a given style. Throws if the style is not registered.

### Adding a New Style

1. Add the style ID to the `LLMProvider` union type in `src/types/index.ts`.
2. Add a `ProviderConfig` entry to `PROVIDER_CONFIGS` in `src/lib/llm/config.ts` with its env var names and default base URL.
3. Add a `ProviderAdapter` entry to `PROVIDER_ADAPTERS` in `src/lib/llm/providers.ts`.

---

## TypeScript Types

**File:** `src/types/index.ts`

### Core Types

```ts
type LLMProvider = 'openai' | 'anthropic'
type CareerTrack = 'cybersecurity'
type DocumentationMode = 'static' | 'integrative'
type ProjectStatus = 'draft' | 'complete' | 'exported'
type InputType = 'text' | 'code' | 'image' | 'file' | 'list' | 'cvss-table'
```

### `LLMConfig`

```ts
interface LLMConfig {
  provider: LLMProvider
  model: string
}
```

### `Project`

```ts
interface Project {
  id: strin
  title: string
  career_track: CareerTrack
  template_id: string
  design_theme: string
  status: ProjectStatus
  public: boolean
  content: Record<string, unknown>
  created_at: string   // ISO 8601
  updated_at: string   // ISO 8601
}
```

### `ProjectSection`

```ts
interface ProjectSection {
  id: string
  project_id: string
  section_id: string
  title: string
  content: string      // markdown
  order: number
  created_at: string
  updated_at: string
}
```

### `ExportRecord`

```ts
interface ExportRecord {
  id: string
  project_id: string
  format: 'pdf' | 'markdown' | 'html'
  filename: string
  created_at: string
}
```

### `Template`

```ts
interface Template {
  id: string
  career_track: CareerTrack
  name: string
  description: string
  question_schema: QuestionSchema[]
  output_structure: OutputSection[]
}
```

### `CVSSFinding`

```ts
interface CVSSFinding {
  id: string
  name: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None'
  cvssScore: number
  cvssVector: string
  impact: string
  remediation: string
}
```
