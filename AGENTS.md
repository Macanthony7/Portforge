<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What this project is

Portforge is a local-first Next.js 15 app for drafting penetration-test reports:
projects, sections, templates, CVSS scoring, LLM-assisted prose, and Markdown /
PDF export. There are no accounts and no server database — all project data
lives in the browser's IndexedDB (`src/lib/db.ts`, Dexie). The only server route
is the LLM proxy in `src/app/api/llm/proxy/route.ts`.

## Setup

Fresh checkout:

```bash
npm ci
cp .env.example .env.local   # optional; most config lives in Settings → LLM Configuration
```

Node 20+ is required. On Windows, run these from Git Bash (the factory scripts
are bash).

## Dev server

```bash
npm run dev -- -p <port>     # next dev --turbopack -p <port>
```

The factory assigns each job its own port: `5100 + 10n` for the builder,
`5101 + 10n` for `reviewer-ux`, `5102 + 10n` for `reviewer-ui`.

## Validation

These are the project's checks, and they match `factory/checks.sh`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`bash factory/checks.sh` runs `npm ci` first, then exactly those three, and is
what the factory gate executes. Change both together.

## Software factory

`/factory run` builds every open GitHub issue labeled `factory` through
intake → spec → build → gate → review → approve, one PR per issue. State is in
`factory/jobs/` (gitignored); `factory/bin/job` is its only writer. Checks:
`factory/checks.sh`. Dashboard: `cd factory && python3 -m http.server`, then
open http://localhost:8000/dashboard.html.

Each job works in its own git worktree, a full checkout of the repo at
`.worktrees/<job-id>` (gitignored). A tool run from the repo root that doesn't
read `.gitignore` sees those copies too; exclude `.worktrees/` in its config.
