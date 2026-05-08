# Portforge — Setup Guide

## What's in this ZIP

A fully scaffolded Next.js 15 project with:
- Auth (Supabase — signup, login, email confirmation)
- Dashboard (project list, stats, new project flow)
- Career track + template + design theme selection
- AI questionnaire engine (Static Mode)
- Streaming AI document generation (Anthropic API)
- Per-section rewrite capability
- Settings (documentation mode toggle, profile)
- Full TypeScript types + Drizzle ORM schema
- All 10 templates across 3 career tracks

---

## Step 1 — Install dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

---

## Step 2 — Install Geist font package

```bash
npm install geist
```

---

## Step 3 — Create your .env.local file

Copy the example file:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in all values:

```
NEXT_PUBLIC_SUPABASE_URL=         ← Supabase → Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    ← Supabase → Project Settings → API → anon public key
SUPABASE_SERVICE_ROLE_KEY=        ← Supabase → Project Settings → API → service_role key
DATABASE_URL=                     ← Supabase → Project Settings → Database → URI (Transaction pooler)
ANTHROPIC_API_KEY=                ← console.anthropic.com → API Keys
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to find each value in Supabase:
1. Go to supabase.com → your project
2. Click "Project Settings" (gear icon, bottom left)
3. Click "API" tab → copy Project URL and anon key
4. Click "Database" tab → copy the "URI" under "Connection string" → "Transaction pooler"
   - Replace [YOUR-PASSWORD] with the database password you set when creating the project

---

## Step 4 — Push the database schema

```bash
npm run db:push
```

You should see:
```
✓ Created table profiles
✓ Created table projects
✓ Created table ai_sessions
```

If you get an error, double-check your DATABASE_URL in .env.local.

---

## Step 5 — Run the auto-profile SQL trigger in Supabase

This automatically creates a profile row whenever a user signs up.

1. Go to supabase.com → your project
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Paste the entire block below and click "Run":

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

---

## Step 6 — Enable email auth in Supabase

1. Go to your Supabase project
2. Click "Authentication" in the left sidebar
3. Click "Providers"
4. Make sure "Email" is enabled (it is by default)
5. For local development, go to "Email Templates" and turn OFF "Confirm email" 
   so you can test without email confirmation

---

## Step 7 — Configure Supabase Row Level Security (RLS)

Run this in the SQL Editor to enable RLS and protect user data:

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.ai_sessions enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Projects: users can only CRUD their own projects
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- AI sessions: scoped to project ownership
create policy "Users can view own ai_sessions" on public.ai_sessions
  for select using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

create policy "Users can insert own ai_sessions" on public.ai_sessions
  for insert with check (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

create policy "Users can update own ai_sessions" on public.ai_sessions
  for update using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );
```

---

## Step 8 — Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## What works right now

| Feature | Status |
|---|---|
| Landing page | ✅ |
| Sign up + email confirmation | ✅ |
| Log in / log out | ✅ |
| Dashboard with project list | ✅ |
| New project — career track selection | ✅ |
| New project — template selection (track-scoped) | ✅ |
| New project — design theme selection (track-scoped) | ✅ |
| New project — free tier limit (2 per track) | ✅ |
| AI questionnaire (Static Mode) | ✅ |
| Streaming AI document generation | ✅ |
| Per-document rewrite | ✅ |
| Settings — documentation mode toggle | ✅ |
| Settings — profile update | ✅ |
| Settings — sign out | ✅ |

## What's next to build

| Feature | Notes |
|---|---|
| PDF export | React-PDF + Vercel serverless function |
| Integrative Mode | GitHub OAuth + Nmap/Burp XML parsers |
| LemonSqueezy payments | Pro + Audit Mode subscription gates |
| Public portfolio page | Shareable /u/[username] page |
| Local Mode | IndexedDB via Dexie.js for offline/private work |
| Markdown editor | Rich editing instead of plain textarea |

---

## Project structure

```
portforge/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login + signup pages
│   │   ├── (dashboard)/      # Dashboard, new project, project editor, settings
│   │   ├── api/
│   │   │   ├── ai/stream/    # Streaming AI generation endpoint
│   │   │   └── auth/callback/# Supabase auth callback
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Global styles
│   ├── lib/
│   │   ├── supabase/         # Browser + server + middleware clients
│   │   ├── anthropic/        # Claude client + prompt builders
│   │   ├── templates/        # All 10 templates across 3 career tracks
│   │   └── utils.ts          # cn(), formatDate(), track labels/icons/colors
│   ├── types/index.ts        # All TypeScript types
│   └── middleware.ts         # Auth route protection
├── drizzle/
│   └── schema.ts             # Database schema
├── drizzle.config.ts
├── .env.example              # Environment variable template
└── SETUP.md                  # This file
```

--

## Tech stack recap

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| ORM | Drizzle ORM |
| AI | Anthropic API (Claude) |
| Hosting (recommended) | Vercel |

---

## Questions?

Every file is fully commented. Work through SETUP.md top to bottom and you'll have a running app in under 30 minutes.
