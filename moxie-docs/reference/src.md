# Project generation workflow and persistence edges

This area implements the end-to-end flow for generating a markdown document from a questionnaire, streaming it to the client, enabling in-place edits, and persisting state in IndexedDB via Dexie. It exists to orchestrate the questionnaire → prompt building → LLM streaming → review/edit → save/export loop for a single project.

## Architecture

- Entry page: `src/app/(dashboard)/project/[id]/page.tsx` exports the `ProjectPage` client component that drives UI state, builds prompts, invokes the LLM client, streams markdown, and persists to Dexie.
- Prompt builders: `src/lib/prompts/index.ts` provides `buildDocumentPrompt` and `buildRegeneratePrompt` to produce exact prompt strings from a `Template` and user answers or rewrite feedback.
- Persistence: `src/lib/db.ts` defines the `PortforgeDB` Dexie schema, exports `db` and CRUD functions (`getProjectById`, `updateProject`, etc.) used by `ProjectPage` to load and persist project content and metadata.
- LLM client: `src/lib/llm/client.ts` defines `LLMClient` and `createLLMClient`. It streams text by POSTing to a browser-safe proxy (`/api/llm/proxy`) and emits partial chunks via `onChunk`.

High-level flow
- Load: `ProjectPage` reads the project and template; if prior content exists it goes to reviewing; otherwise questionnaire.
- Generate: After final question, it builds a prompt (`buildDocumentPrompt`), calls `LLMClient.generateText` with `onChunk` to progressively render markdown, then persists `{ content: { generated, edited }, status: 'complete' }` via `updateProject`.
- Edit/save: The `MarkdownEditor` calls `saveEdited`, which updates only `edited` and maintains `generated` for provenance.
- Rewrite: Builds a refinement prompt with `buildRegeneratePrompt`, streams a full rewrite, replaces `edited` and `generated`, and persists via `updateProject`.

## src/app/(dashboard)/project/[id]/page.tsx (ProjectPage)

Responsibility
- Client-side React component controlling the lifecycle for a single `Project` identified by `[id]` from the route. Manages questionnaire progression, LLM streaming, and Dexie persistence.

Entry/initialization
- Gets `id` from `useParams<{ id: string }>()` and a `router` for navigation.
- Loads from Dexie: `const proj = await getProjectById(id)`; redirects to `/dashboard` when not found.
- Loads the `Template` with `getTemplateById(proj.template_id)`; redirects to `/dashboard` when missing.
- Determines stage:
  - If `proj.content.generated` or `proj.content.edited` is present: set both `generatedDoc` and `editedDoc` to that doc and `stage` to `'reviewing'`.
  - Else `stage` to `'questionnaire'`.

State machine and UI stages
- `Stage` union: `'loading' | 'questionnaire' | 'generating' | 'reviewing'`.
- Questionnaire
  - `questions = template?.question_schema || []` and `currentQuestion` by index.
  - `handleNext` merges `currentAnswer` into `answers`. When at end, calls `generateDocument(newAnswers)`.
  - `goBack` decrements, repopulates `currentAnswer` from `answers`.
  - Skip button available when `!currentQuestion.required` (advances without adding an answer). The final Skip triggers `generateDocument(answers)` with the accumulated partial answers.
- Generating
  - Shows spinner and progressively renders `generatedDoc` via `MarkdownRenderer` as streaming chunks arrive.
- Reviewing
  - Displays `MarkdownEditor` with `value={editedDoc || generatedDoc}`; on change, calls `saveEdited` to persist.
  - Rewrite mode shows a textarea for `rewriteFeedback` and calls `handleRewrite`.
  - Export markdown triggers `handleExportMd` to download a `.md` file derived from `project.title`.

LLM invocation and streaming
- Provider/model selection: reads `portforge_provider` (as `LLMProvider`) and `portforge_model` from `localStorage`. Defaults `provider` to `'anthropic'` if absent; `model` defaults to `''` (empty string) if absent.
- API key lookup: `const apiKey = getStoredApiKey(provider)`. If missing, sets a user-facing error and aborts generation or rewrite.
- Client creation: `const client = createLLMClient({ provider, model, apiKey })`.
- Document generation (`generateDocument`):
  - Builds prompt: `const prompt = buildDocumentPrompt(template!, finalAnswers)`.
  - Streams: `await client.generateText({ prompt, maxTokens: 4096, onChunk: (ch) => { doc += ch; setGeneratedDoc(prev => prev + ch) } })`.
    - The `onChunk` callback is invoked for each parsed text fragment; `generatedDoc` in state accumulates visible content as chunks arrive.
  - On completion, persists: `updateProject(id, { content: { generated: doc, edited: doc }, status: 'complete' })` and transitions to `'reviewing'`.
  - Error handling: `catch` sets `error` to `err.message` or `'Generation failed'`, stops streaming, and returns to `'questionnaire'`. A `finally` also sets `streaming` to `false`.
- Rewrite (`handleRewrite`):
  - Requires non-empty `rewriteFeedback`; otherwise no-op.
  - Builds prompt: `buildRegeneratePrompt(editedDoc || generatedDoc, rewriteFeedback)`.
  - Same streaming semantics and `maxTokens: 4096`. Accumulates into `doc`, sets `generatedDoc` in UI, then sets `editedDoc(doc)` and persists via `updateProject` with `{ content: { generated: doc, edited: doc }, status: 'complete' }`.
  - Errors set `error` to `err.message` or `'Rewrite failed'`.

Persistence calls
- Load: `getProjectById(id)`.
- Save edited content: `updateProject(id, { content: { generated: generatedDoc, edited: content }, status: 'complete' })`.
- Save after generation/rewrite: same shape with both `generated` and `edited` set to the streamed result.

Notable edge behaviors
- Missing API key during generation: user-facing error "No API key configured. Go to Settings → LLM Configuration to add your key." Stage reverts to `'questionnaire'`.
- Missing API key during rewrite: user-facing error "No API key configured." and stays in reviewing (no stage change is made here).
- Partial streams: `generatedDoc` state always reflects whatever has arrived so far via `onChunk`; if an error occurs mid-stream, nothing is persisted unless the function reaches the post-stream `updateProject` call.
- Save semantics: Edits are immediately persisted with `status: 'complete'`. `generated` remains as the last fully generated or rewritten text for provenance; `edited` is the source of truth for the editor and export.

## src/lib/prompts/index.ts

### buildDocumentPrompt(template: Template, answers: Record<string, string>): string
- Responsibility: Constructs the full instruction prompt for the LLM to create a complete markdown document following the chosen template.
- Behavior details
  - `TRACK_CONTEXT.cybersecurity` is "cybersecurity professional, penetration tester, or security researcher" and is embedded in the prompt persona.
  - Builds `answersText` from `template.question_schema`, including only answered questions: lines formatted as `### ${q.section} — ${q.question}\n${answer}` separated by blank lines.
  - The prompt includes explicit CRITICAL INSTRUCTIONS:
    - "Write the COMPLETE document — not a template, not placeholders, not instructions"
    - Professional tone, markdown headings, include code with language tags, infer professionally, shareable document, markdown formatting, and CVSS vector string inclusion in findings table.
  - `OUTPUT SECTIONS TO INCLUDE` lists `template.output_structure` as a numbered list by title.
  - Appends `USER PROVIDED INFORMATION` with the assembled answers.
  - Ends with: "Now write the complete, professional document in markdown format:" to solicit direct content output.

### buildRegeneratePrompt(currentContent: string, userFeedback: string): string
- Responsibility: Produces a rewrite instruction prompt that includes the entire current document and the user’s feedback.
- Behavior details
  - Persona matches cybersecurity context.
  - Embeds `CURRENT DOCUMENT:` with `currentContent` and `USER INSTRUCTIONS:` with `userFeedback`.
  - Explicitly instructs: "Rewrite the ENTIRE document ... Return only the rewritten document content in markdown, no preamble or explanation."

## src/lib/db.ts

### PortforgeDB (Dexie schema)
- Class: `export class PortforgeDB extends Dexie`
- Tables
  - `projects!: Table<Project, string>` indexed by: `'id, title, template_id, status, updated_at'`.
  - `projectSections!: Table<ProjectSection, string>` indexed by: `'id, project_id, section_id, order'`.
  - `llmConfig!: Table<LLMConfig & { id: string }, string>` indexed by: `'id'`.
  - `exportHistory!: Table<ExportRecord, string>` indexed by: `'id, project_id, format, created_at'`.
- Versioning: `this.version(1).stores({ ... })` initializes the schema.
- Exported instance: `export const db = new PortforgeDB()`.

### Project CRUD
- getAllProjects(): Promise<Project[]>
  - `return db.projects.orderBy('updated_at').reverse().toArray()`; newest first by `updated_at`.
- getProjectById(id: string): Promise<Project | undefined>
  - `return db.projects.get(id)`; used by `ProjectPage`.
- createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project>
  - Generates `id = pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.
  - Stamps ISO timestamps for `created_at` and `updated_at` and inserts into `projects`.
- updateProject(id: string, updates: Partial<Project>): Promise<void>
  - Updates fields and always sets `updated_at: new Date().toISOString()`.
- deleteProject(id: string): Promise<void>
  - Cascades: deletes `projectSections` and `exportHistory` for the project, then removes the project record.

### Sections
- getProjectSections(projectId: string): Promise<ProjectSection[]>
  - Queries by `project_id` and sorts by `order`.
- saveSection(section: ProjectSection): Promise<void>
  - Upserts with `db.projectSections.put(section)`.

### LLM Config
- getLLMConfig(): Promise<LLMConfig | null>
  - Fetches `db.llmConfig.get('default')`; returns the stored config without the `id` property if present, otherwise `null`.
- saveLLMConfig(config: LLMConfig): Promise<void>
  - Upserts at key `'default'` via `db.llmConfig.put({ ...config, id: 'default' })`.
- clearLLMConfig(): Promise<void>
  - Deletes `'default'` from `llmConfig`.

### Export History
- addExportRecord(record: Omit<ExportRecord, 'id'>): Promise<void>
  - Creates `id = exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` and inserts.
- getExportHistory(projectId: string): Promise<ExportRecord[]>
  - Returns reverse-ordered by Dexie cursor for the given project.

Persistence semantics used by ProjectPage
- Edits and generations both use `updateProject` which will advance `updated_at` automatically.
- `content` shape is treated as an object with `generated` and `edited` string properties in the page logic; `db.ts` does not enforce the content schema itself.

## src/lib/llm/client.ts

### Types and factory
- GenerateOptions
  - `prompt: string`
  - `maxTokens?: number`
  - `onChunk?: (chunk: string) => void`
- createLLMClient(config: LLMConfig): LLMClient
  - Returns a new `LLMClient` bound to the given provider, model, key, and optional `customEndpoint`.

### LLMClient
- Constructor: `new LLMClient(config: LLMConfig)` stores config.
- Adapter resolution
  - `getAdapter(this.config.provider)` determines provider-specific endpoints, headers, body, and stream parsing via `adapter.endpoint`, `adapter.body`, `adapter.headers`, `adapter.parseStream`, `adapter.testBody`, and `adapter.parseTest`.
- Base URL
  - Uses `config.customEndpoint` if provided; else `PROVIDER_CONFIGS[this.config.provider].baseUrl`.

Streaming request logic
- Browser vs server path
  - Detects browser with `typeof window !== 'undefined'`.
  - In browser: always POSTs to `/api/llm/proxy` with JSON body containing `{ provider, model, prompt, maxTokens, customEndpoint, clientApiKey }`. This keeps provider API keys out of the client’s network surface.
  - Server: calls provider adapter directly with `endpoint`, JSON `body`, and `headers` derived from `adapter.headers(this.config.apiKey)`.
- Error handling
  - If `!res.ok`, reads `res.text()` and throws `new Error(
    'LLM request failed: ' + res.status + ' ' + text
  )`.
  - If `!res.body`, throws `new Error('No response body')`.

generateText(options: GenerateOptions): Promise<string>
- Reads and decodes the response stream via `res.body.getReader()` and `TextDecoder()`.
- Splits by `\n`, trims, and feeds each non-empty `line` into `adapter.parseStream(trimmed)`.
- When `result && result.text`, appends to `fullText` and calls `onChunk?.(result.text)` for incremental UI updates.
- Resolves to the full concatenated `fullText` when the stream completes.

streamText(options: GenerateOptions): AsyncGenerator<string>
- Same request and parsing logic as `generateText`, but yields `result.text` chunks to the caller as an async generator.

testConnection(): Promise<{ success: boolean; error?: string }>
- Browser: POSTs to `/api/llm/proxy` with `{ test: true }` alongside `provider`, `model`, `customEndpoint`, and `clientApiKey`, then returns `adapter.parseTest(res)`.
- Server: Calls provider endpoint with `adapter.testBody(this.config.model)` and returns `adapter.parseTest(res)`.
- Catches exceptions and returns `{ success: false, error: <message> }`.

Interplay with ProjectPage
- `ProjectPage` uses `createLLMClient({ provider, model, apiKey })` and `generateText({ prompt, maxTokens: 4096, onChunk })`.
- The `onChunk` handler directly updates `generatedDoc` state for live preview. Only after `generateText` resolves does the page persist the finalized `doc`.

## Gotchas

- Missing API key behaviors differ by action
  - Generation: `ProjectPage` sets a specific error instructing the user to go to Settings and reverts stage to `'questionnaire'`.
  - Rewrite: `ProjectPage` sets a shorter error and leaves the user in reviewing with rewrite mode exited; no stage change.
- Partial output and persistence
  - If the stream errors or is interrupted, nothing is saved because `updateProject` is only called after `generateText` completes. The UI may still show partial `generatedDoc` from `onChunk`.
- Provider/model configuration
  - `portforge_model` can be an empty string; ensure your proxy or adapter tolerates that. `ProjectPage` does not validate `model` before requesting.
- Update semantics
  - `updateProject` always updates `updated_at`. Any content auto-save or rewrite will move the project to the top of `getAllProjects()` ordering.
- Content shape assumptions
  - `ProjectPage` expects `project.content` to be an object with `generated` and/or `edited` string keys. If the stored content schema changes, loading logic that sets `generatedDoc`/`editedDoc` and the `saveEdited`/`updateProject` calls must be updated accordingly.
- Streaming parse contract
  - `LLMClient` relies on the provider adapter’s `parseStream` returning `{ text: string }` lines from the raw event stream. If adapters change their output format or line delimiters, `generatedDoc` updates will stall or concatenate incorrectly.
- Browser proxy dependency
  - All browser-side generations route through `/api/llm/proxy`. If that endpoint is missing or misconfigured, `LLM request failed: <status>` errors will surface. The client always sends `clientApiKey` in the JSON body for the proxy to authenticate upstream requests.