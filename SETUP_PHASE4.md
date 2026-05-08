# Portforge Phase 4 — Company Docs Feature

## What's new

| Feature | Status |
|---|---|
| Company docs project type in dashboard | ✅ |
| 5 document types: User Guide, API Docs, Whitepaper, Audit Report, Full Suite | ✅ |
| GitHub repo scanning + auto-fill questions | ✅ |
| AI writes complete structured documentation | ✅ |
| Section-by-section preview and edit | ✅ |
| Per-section AI rewrite | ✅ |
| PR auto-sync webhook (paid tier) | ✅ |
| Hosted docs page `/docs/[slug]` (dormant, ready to activate) | ✅ Built-in |
| Updated dashboard showing both project types | ✅ |
| Free tier: 1 company docs project | ✅ |

---

## Step 1 — Copy files into your project

Copy all files from this ZIP into your existing portforge folder.
Your `.env.local` is NOT affected.

---

## Step 2 — Run the company docs SQL in Supabase SQL Editor

Open `company_schema.sql` from this ZIP and paste + run the entire file in your Supabase SQL Editor.

This creates the `company_projects` table with all required columns and RLS policies.

---

## Step 3 — Restart dev server

```bash
npm run dev
```

---

## How it works

### Creating a company doc

1. Dashboard → **"New company docs"** button
2. Select document type (User Guide, API Docs, Whitepaper, Audit Report, Full Suite)
3. Optionally paste a GitHub repo URL — AI scans the code and pre-fills answers
4. Answer gap-fill questions (only what the repo couldn't answer)
5. AI writes the complete documentation — all sections, all content
6. Review and edit each section independently
7. Request rewrites per section with natural language instructions
8. Export as Markdown (free) or PDF (Pro)

### PR Auto-sync (Paid tier)

When enabled, every time a PR is merged to your connected repo:
1. GitHub sends a webhook to `/api/company/webhook`
2. AI scans the diff and identifies which doc sections are affected
3. AI rewrites those sections automatically
4. Affected sections are flagged "⚠ review needed" in the editor
5. You verify the updates and mark them as confirmed

**Setting up the webhook:**
1. Open a company doc project → click "⬡ Enable PR sync"
2. Copy the webhook URL shown
3. Go to your GitHub repo → Settings → Webhooks → Add webhook
4. Paste the URL, set content type to `application/json`
5. Select event: "Pull requests"
6. Copy the secret shown in Portforge and paste it as the webhook secret in GitHub
7. Save

### Hosted docs (dormant)

The `/docs/[slug]` page is fully built. To activate:

1. In Supabase, set `hosting_active = true` on a company project
2. In `src/app/docs/[slug]/page.tsx`, change line:
   ```typescript
   const HOSTING_DISABLED = true  // ← change to false
   ```
3. Deploy — docs are immediately live at `yoursite.com/docs/[slug]`

For custom domains (when budget allows):
- Use Vercel's custom domains API
- Or configure wildcard DNS `*.portforge.io` → your deployment

---

## Document types

| Type | Sections | Best for |
|---|---|---|
| User Guide | Intro, Getting Started, Features, How-to, Troubleshooting, FAQ | SaaS apps, consumer products |
| API & Webhook Docs | Overview, Auth, Endpoints, Webhooks, SDKs, Errors, Rate Limits, Changelog | Developer tools, APIs |
| Whitepaper | Abstract, Intro, Solution, Architecture, Tokenomics, Governance, Roadmap, Team | Crypto/web3 projects |
| Audit Report | Executive Summary, Scope, Findings, Critical Issues, Medium/Low Issues, Remediation | Security reviews |
| Full Suite | Product Overview, Getting Started, Features, API, Auth, Endpoints, Webhooks, Errors, FAQ, Changelog | Full product launch |

---

## Tier access

| Feature | Free | Pro | Audit |
|---|---|---|---|
| Company docs projects | 1 | Unlimited | Unlimited |
| All 5 doc types | ✅ | ✅ | ✅ |
| GitHub repo scanning | ✅ | ✅ | ✅ |
| Section editing + rewrite | ✅ | ✅ | ✅ |
| Markdown export | ✅ | ✅ | ✅ |
| PDF export | ✗ | ✅ | ✅ |
| PR auto-sync webhook | ✗ | ✗ | ✅ |
| Hosted docs page | Coming soon | Coming soon | Coming soon |
| Custom domain | Coming soon | — | Coming soon |

---

## Files added/changed in this update

**New files:**
- `src/lib/company/templates.ts` — 5 doc types with question schemas
- `src/lib/company/prompts.ts` — AI prompt builders
- `src/app/api/company/generate/route.ts` — streaming generation
- `src/app/api/company/update-section/route.ts` — per-section rewrite
- `src/app/api/company/webhook/route.ts` — GitHub PR webhook handler
- `src/app/(dashboard)/dashboard/company/new/page.tsx` — new project flow
- `src/app/(dashboard)/company/[id]/page.tsx` — section editor
- `src/app/docs/[slug]/page.tsx` — hosted docs (dormant)
- `company_schema.sql` — database schema

**Updated files:**
- `src/app/(dashboard)/dashboard/page.tsx` — shows both project types
