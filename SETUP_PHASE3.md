# Portforge Phase 3 — Complete Setup Guide

## What's new in Phase 3

| Feature | Status |
|---|---|
| All 10 templates (3 cyber, 3 dev, 4 devops) | ✅ |
| AI questionnaire + full document generation | ✅ |
| Streaming AI with live preview | ✅ |
| Markdown renderer (headings, tables, code blocks) | ✅ |
| Markdown editor with toolbar + preview toggle | ✅ |
| PDF / HTML themed export (Pro tier) | ✅ |
| Markdown export (free) | ✅ |
| Per-document rewrite | ✅ |
| LemonSqueezy payments + webhook handler | ✅ |
| Upgrade modal on all paid features | ✅ |
| GitHub repo integration | ✅ |
| Nmap XML parser | ✅ |
| Burp Suite XML parser | ✅ |
| Public portfolio page `/u/[username]` | ✅ |
| Portfolio management page | ✅ |
| Per-project public/private toggle | ✅ |
| Settings: username, bio, portfolio visibility | ✅ |
| Settings: documentation mode toggle | ✅ |
| Settings: local mode toggle (browser-only storage) | ✅ |
| Free tier limit (2 projects per track) | ✅ |

---

## First time setup (if starting fresh)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Create .env.local
```bash
cp .env.example .env.local
```
Fill in all values. See comments in the file for where to find each one.

### Step 3 — Push database schema
```bash
npm run db:push
```

### Step 4 — Run SQL in Supabase SQL Editor

**Auto-profile trigger** (creates a profile row when a user signs up):
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Row Level Security policies** (protects user data):
```sql
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.ai_sessions enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users view own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Public projects visible" on public.projects for select using (public = true);
create policy "Users insert own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users delete own projects" on public.projects for delete using (auth.uid() = user_id);

create policy "Users view own sessions" on public.ai_sessions for select using (
  exists (select 1 from public.projects where id = project_id and user_id = auth.uid()));
create policy "Users insert own sessions" on public.ai_sessions for insert with check (
  exists (select 1 from public.projects where id = project_id and user_id = auth.uid()));
create policy "Users update own sessions" on public.ai_sessions for update using (
  exists (select 1 from public.projects where id = project_id and user_id = auth.uid()));
```

**Add new columns** (Phase 3 adds username, bio, portfolio_public, public):
```sql
alter table public.profiles
  add column if not exists username text unique,
  add column if not exists bio text,
  add column if not exists portfolio_public boolean not null default true;

alter table public.projects
  add column if not exists public boolean not null default false;
```

### Step 5 — Start dev server
```bash
npm run dev
```
Open http://localhost:3000

---

## Upgrading from Phase 1 or 2

If you already have the Phase 1 or 2 project running:

1. Copy all new files from this ZIP into your existing project folder (replace existing files)
2. Add new env vars from `.env.example` to your `.env.local`
3. Run `npm install` to pick up any new deps
4. Run only the **"Add new columns"** SQL block above in Supabase SQL Editor
5. Restart the dev server

---

## Setting up LemonSqueezy payments

1. Go to **lemonsqueezy.com** → create an account + store
2. Create two Products:
   - **Portforge Pro** — $12/month recurring
   - **Portforge Audit Mode** — $28/month recurring
3. For each product, copy the **Variant ID** from the product page URL or settings
4. Go to **Settings → API** → create an API key
5. Go to **Settings → Webhooks** → add endpoint:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `order_created`, `subscription_created`, `subscription_expired`, `subscription_cancelled`
   - Copy the signing secret
6. Fill all values into `.env.local`

**Testing locally with ngrok:**
```bash
npx ngrok http 3000
# Use the ngrok HTTPS URL as your webhook URL in LemonSqueezy
```

---

## How PDF export works

The export generates a themed HTML file. To print as PDF:
1. Open the downloaded `.html` file in Chrome
2. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
3. Destination: **Save as PDF**
4. More settings → enable **Background graphics**
5. Save

---

## How integrations work

### Nmap
Run your scan with XML output:
```bash
nmap -sV -A -oX scan.xml 10.0.0.1/24
```
Upload `scan.xml` in the project editor → "⬡ Import data" button.

### Burp Suite
Export from Burp: **Target → Site map → right-click → Issues → Export issues as XML**
Upload the XML in the project editor.

### GitHub
Paste any public repo URL. For private repos add a `GITHUB_TOKEN` to `.env.local`.

---

## Portfolio setup

1. Go to **Settings** → set your **Username** (e.g. `ada-lovelace`)
2. Your portfolio is at `/u/ada-lovelace`
3. Go to **Portfolio** page → toggle individual projects public/private
4. Share your portfolio URL with recruiters

---

## Feature access by tier

| Feature | Free | Pro ($12) | Audit ($28) |
|---|---|---|---|
| All templates | ✅ | ✅ | ✅ |
| AI document generation | ✅ | ✅ | ✅ |
| Projects per career track | 2 | Unlimited | Unlimited |
| Markdown export | ✅ | ✅ | ✅ |
| Themed PDF/HTML export | ✗ | ✅ | ✅ |
| Public portfolio page | ✅ | ✅ | ✅ |
| Local mode | ✅ | ✅ | ✅ |
| GitHub integration | ✗ | ✗ | ✅ |
| Nmap XML import | ✗ | ✗ | ✅ |
| Burp Suite import | ✗ | ✗ | ✅ |

---

## Project structure

```
portforge/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Login + signup
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Sidebar navigation
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Dashboard home
│   │   │   │   ├── new/page.tsx       # New project (4-step)
│   │   │   │   ├── settings/page.tsx  # Settings
│   │   │   │   └── portfolio/page.tsx # Portfolio manager
│   │   │   └── project/[id]/page.tsx  # Project editor
│   │   ├── api/
│   │   │   ├── ai/stream/             # Streaming AI generation
│   │   │   ├── auth/callback/         # Supabase auth callback
│   │   │   ├── export/pdf/            # Themed export
│   │   │   ├── payments/              # LemonSqueezy checkout + webhook
│   │   │   └── integrations/          # GitHub, Nmap, Burp parsers
│   │   ├── u/[username]/page.tsx      # Public portfolio page
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Landing page
│   │   └── globals.css
│   ├── components/ui/
│   │   ├── markdown-renderer.tsx
│   │   ├── markdown-editor.tsx
│   │   └── upgrade-modal.tsx
│   ├── hooks/
│   │   └── use-local-mode.ts
│   ├── lib/
│   │   ├── supabase/                  # client, server, middleware
│   │   ├── anthropic/                 # client, prompts
│   │   ├── templates/index.ts         # All 10 templates + themes
│   │   ├── db.ts
│   │   └── utils.ts
│   ├── types/index.ts
│   └── middleware.ts
├── drizzle/schema.ts
├── .env.example
└── SETUP_PHASE3.md
```

---

## What's next

- Native Puppeteer PDF generation (true PDF, not HTML-to-print)
- Email notifications on subscription changes
- Vercel production deployment guide
- TryHackMe / HackTheBox lab import integration
- Data/ML Engineering career track
