# Cloud Setup (Supabase)

By default, Portforge runs entirely in the browser with no backend required. This guide covers the optional Supabase integration for hosted deployments with authentication, cloud storage, and shared access.

---

## Table of Contents

- [When to Use Cloud Mode](#when-to-use-cloud-mode)
- [Prerequisites](#prerequisites)
- [1. Create a Supabase Project](#1-create-a-supabase-project)
- [2. Configure Environment Variables](#2-configure-environment-variables)
- [3. Push the Database Schema](#3-push-the-database-schema)
- [4. Run the Auto-Profile Trigger](#4-run-the-auto-profile-trigger)
- [5. Enable Row Level Security](#5-enable-row-level-security)
- [6. Configure Authentication](#6-configure-authentication)
- [7. Run the Dev Server](#7-run-the-dev-server)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Schema Reference](#database-schema-reference)

---

## When to Use Cloud Mode

| Feature | Local-First | Cloud Mode |
|---------|-------------|------------|
| No signup required | ✅ | ❌ |
| Data persists across devices | ❌ | ✅ |
| Multi-user support | ❌ | ✅ |
| Authentication | ❌ | ✅ |
| Streaming AI endpoints | ❌ | ✅ |
| Offline capable | ✅ | Partial |

If you're building a personal tool or contributing locally, stick with local-first mode. Cloud mode is for hosted deployments or teams.

---

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier is sufficient)
- Node.js 18+
- The Portforge repo cloned locally

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose an organization, give the project a name, set a strong database password, and select a region close to your users.
4. Wait for the project to finish provisioning (~1 minute).

---

## 2. Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values from your Supabase project dashboard (**Settings → API**):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

> Use the **Transaction pooler** connection string for `DATABASE_URL` (port 6543), not the direct connection. This is required for serverless/edge deployments.

---

## 3. Push the Database Schema

Portforge uses [Drizzle ORM](https://orm.drizzle.team/) to manage the schema. Push it to your Supabase database:

```bash
npm run db:push
```

This creates the `profiles`, `projects`, and `ai_sessions` tables.

To also enable the company documentation feature, run the additional SQL in the Supabase SQL Editor:

```bash
# Copy the contents of company_schema.sql and run it in:
# Supabase Dashboard → SQL Editor → New Query
```

---

## 4. Run the Auto-Profile Trigger

When a user signs up, Portforge automatically creates a row in the `profiles` table. This requires a PostgreSQL trigger.

In the Supabase SQL Editor, run:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now());
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 5. Enable Row Level Security

RLS ensures users can only access their own data. Run the following policies in the Supabase SQL Editor:

```sql
-- Profiles: users can read and update their own profile
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Projects: users can CRUD their own projects
alter table projects enable row level security;

create policy "Users can view own projects"
  on projects for select using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on projects for insert with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete using (auth.uid() = user_id);

-- AI Sessions: users can CRUD their own sessions
alter table ai_sessions enable row level security;

create policy "Users can manage own ai_sessions"
  on ai_sessions for all using (auth.uid() = user_id);
```

---

## 6. Configure Authentication

### Enable Email Auth

In the Supabase Dashboard:

1. Go to **Authentication → Providers**.
2. Ensure **Email** is enabled.

### Disable Email Confirmation (Local Dev Only)

For local development, you may want to skip email confirmation:

1. Go to **Authentication → Settings**.
2. Under **Email Auth**, disable **Enable email confirmations**.

> Re-enable this for production deployments.

### Configure Redirect URLs

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to your app URL (e.g. `http://localhost:3000` for local dev).
3. Add your production URL to **Redirect URLs** when deploying.

---

## 7. Run the Dev Server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000). You should now be able to sign up and log in.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud mode | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud mode | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloud mode | Supabase service role key (server-side only) |
| `DATABASE_URL` | Cloud mode | Postgres connection string (Transaction pooler) |
| `NEXT_PUBLIC_APP_URL` | Optional | Your app's public URL, default `http://localhost:3000` |
| `PROXY_SECRET` | Optional | If set, all `/api/llm/proxy` requests must include `x-proxy-secret: <value>` |
| `ANTHROPIC_API_KEY` | Optional | Server-side Anthropic key (fallback if no clientApiKey) |
| `OPENAI_API_KEY` | Optional | Server-side OpenAI key |
| `GOOGLE_API_KEY` | Optional | Server-side Google key |
| `NVIDIA_API_KEY` | Optional | Server-side NVIDIA NIM key |
| `GROQ_API_KEY` | Optional | Server-side Groq key |
| `MOONSHOT_API_KEY` | Optional | Server-side Moonshot key |
| `ZAI_API_KEY` | Optional | Server-side Z-ai key |
| `MINIMAX_API_KEY` | Optional | Server-side Minimax key |

---

## Database Schema Reference

Defined in `drizzle/schema.ts`.

### `profiles`

Stores user profile data. Auto-created on signup via the trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, matches `auth.users.id` |
| `email` | `text` | User's email |
| `full_name` | `text` | Optional display name |
| `username` | `text` | Optional unique username |
| `career_track` | `text` | e.g. `"cybersecurity"` |
| `documentation_mode` | `text` | `"static"` or `"integrative"` |
| `bio` | `text` | Optional bio |
| `created_at` | `timestamp` | Auto-set on insert |

### `projects`

Stores project data with JSONB content.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Foreign key → `profiles.id` |
| `title` | `text` | Project title |
| `career_track` | `text` | e.g. `"cybersecurity"` |
| `template_id` | `text` | e.g. `"cyber-pentest-report"` |
| `design_theme` | `text` | e.g. `"cyber-forge-dark"` |
| `status` | `text` | `"draft"`, `"complete"`, or `"exported"` |
| `public` | `boolean` | Whether the project is publicly viewable |
| `content` | `jsonb` | Flexible content storage |
| `created_at` | `timestamp` | Auto-set |
| `updated_at` | `timestamp` | Updated on every save |

### `ai_sessions`

Stores AI questionnaire answers and generated content per project.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Foreign key → `profiles.id` |
| `project_id` | `uuid` | Foreign key → `projects.id` |
| `answers` | `jsonb` | Map of question ID → answer |
| `generated_content` | `text` | The AI-generated markdown document |
| `created_at` | `timestamp` | Auto-set |
| `updated_at` | `timestamp` | Updated on regeneration |
