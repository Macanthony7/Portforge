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

#### Request Body

```ts
{
  provider: LLMProvider        // required — e.g. "anthropic", "openai", "groq"
  model: string                // required — e.g. "claude-3-5-sonnet-20241022"
  prompt?: string              // required unless test: true
  maxTokens?: number           // default: 4096
  customEndpoint?: string      // optional — override the provider's base URL
  test?: boolean               // default: false — if true, sends a minimal test message
  clientApiKey?: string        // the user's API key from localStorage
}
```

#### API Key Resolution

The proxy resolves the API key in this order:

1. `clientApiKey` from the request body
2. `Authorization: Bearer <token>` header
3. Environment variable for the provider (e.g. `ANTHROPIC_API_KEY`)

If none are found, the proxy returns `400`.

#### Optional Proxy Secret

Set `PROXY_SECRET` in your environment to require all proxy requests to include the header `x-proxy-secret: <your-secret>`. Requests without it receive `403`. This is useful for hosted deployments to prevent unauthorized use.

#### Response

The proxy streams the upstream provider's response body directly to the client, preserving all headers and status codes.

#### Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Missing `provider`, `model`, `prompt`, or API key |
| `403` | Invalid or missing `x-proxy-secret` |
| `500` | Unexpected server error |

---

## LLMClient

**File:** `src/lib/llm/client.ts`

The main class for interacting with LLM providers. Instantiate it with an `LLMConfig` object.

### `createLLMClient(config: LLMConfig): LLMClient`

Factory function — preferred way to create a client.

```ts
import { createLLMClient } from '@/lib/llm/client'

const client = createLLMClient({
  provider: 'groq',
  model: 'llama3-70b-8192',
  apiKey: 'your-api-key',
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

These helpers manage API keys in `localStorage` and expose provider metadata.

### `getStoredApiKey(provider: LLMProvider): string`

Returns the stored API key for a provider, or an empty string if none is saved. Safe to call server-side (returns `''`).

### `storeApiKey(provider: LLMProvider, apiKey: string): void`

Saves an API key to `localStorage` under the key `portforge_apikey_<provider>`.

### `clearAllApiKeys(): void`

Removes all stored API keys from `localStorage` for all known providers.

### `getModelsForProvider(provider: LLMProvider): ProviderModel[]`

Returns the list of available models for a provider.

### `getProviderName(provider: LLMProvider): string`

Returns the human-readable display name for a provider (e.g. `"Anthropic"`, `"Groq"`).

---

## Provider Adapters

**File:** `src/lib/llm/providers.ts`

Each LLM provider is implemented as a `ProviderAdapter` object. You generally don't call these directly — `LLMClient` uses them internally.

### `ProviderAdapter` Interface

```ts
interface ProviderAdapter {
  endpoint: (config: { model: string; customEndpoint?: string }) => string
  headers: (apiKey: string) => Record<string, string>
  body: (prompt: string, model: string, maxTokens: number) => unknown
  parseStream: (line: string) => StreamChunk | null
  testMessage: string
  testBody: (model: string) => unknown
  parseTest: (response: Response) => Promise<{ success: boolean; error?: string }>
}
```

### `getAdapter(provider: LLMProvider): ProviderAdapter`

Returns the adapter for a given provider. Throws if the provider is not registered.

### Adding a New Provider

1. Add the provider ID to the `LLMProvider` union type in `src/types/index.ts`.
2. Add a `ProviderConfig` entry to `PROVIDER_CONFIGS` in `src/lib/llm/config.ts`.
3. Add a `ProviderAdapter` entry to `PROVIDER_ADAPTERS` in `src/lib/llm/providers.ts`.
4. Add the env var mapping to `ENV_KEY_MAP` in `src/app/api/llm/proxy/route.ts`.

---

## TypeScript Types

**File:** `src/types/index.ts`

### Core Types

```ts
type LLMProvider = 'anthropic' | 'openai' | 'google' | 'nvidia' | 'groq' | 'moonshot' | 'z-ai' | 'minimax'
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
  apiKey: string
  customEndpoint?: string
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
