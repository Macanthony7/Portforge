-- Run this in your Supabase SQL Editor to add company docs support
-- Add to your existing schema

CREATE TYPE IF NOT EXISTS company_doc_type AS ENUM (
  'user_guide', 'api_docs', 'whitepaper', 'audit_report', 'full_suite'
);

CREATE TYPE IF NOT EXISTS pr_sync_status AS ENUM (
  'idle', 'pending_review', 'syncing', 'error'
);

CREATE TABLE IF NOT EXISTS company_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_type company_doc_type NOT NULL,
  repo_url TEXT,
  repo_data JSONB DEFAULT '{}',
  slug TEXT UNIQUE,
  custom_domain TEXT,
  -- HOSTING_ACTIVE: set hosting_active = true when ready to activate hosting
  hosting_active BOOLEAN NOT NULL DEFAULT false,
  pr_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  pr_sync_status pr_sync_status NOT NULL DEFAULT 'idle',
  webhook_secret TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE company_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company projects" ON company_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public hosted docs visible" ON company_projects
  FOR SELECT USING (hosting_active = true);

CREATE POLICY "Users insert own company projects" ON company_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own company projects" ON company_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own company projects" ON company_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Index for slug lookups (used by hosted docs)
CREATE INDEX IF NOT EXISTS company_projects_slug_idx ON company_projects(slug)
  WHERE hosting_active = true;
