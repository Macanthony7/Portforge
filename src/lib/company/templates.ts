export type CompanyDocType =
  | 'user_guide'
  | 'api_docs'
  | 'whitepaper'
  | 'audit_report'
  | 'full_suite'

export type PRSyncStatus = 'idle' | 'pending_review' | 'syncing' | 'error'

export interface CompanyProject {
  id: string
  user_id: string
  name: string
  doc_type: CompanyDocType
  repo_url: string | null
  repo_data: Record<string, unknown>
  slug: string | null
  custom_domain: string | null
  hosting_active: boolean
  pr_sync_enabled: boolean
  pr_sync_status: PRSyncStatus
  webhook_secret: string | null
  sections: CompanyDocSection[]
  status: 'draft' | 'complete' | 'published'
  created_at: string
  updated_at: string
}

export interface CompanyDocSection {
  id: string
  title: string
  content: string
  order: number
  last_synced_at: string | null
  needs_review: boolean
}

export interface CompanyDocTemplate {
  id: CompanyDocType
  name: string
  description: string
  icon: string
  audience: string
  sections: { id: string; title: string; order: number }[]
  questions: CompanyDocQuestion[]
  repoQuestions: CompanyDocQuestion[]
}

export interface CompanyDocQuestion {
  id: string
  question: string
  hint: string
  input_type: 'text' | 'code' | 'list' | 'url'
  required: boolean
  section: string
}

export const COMPANY_DOC_TEMPLATES: CompanyDocTemplate[] = [
  // ── USER GUIDE ─────────────────────────────────────────────────
  {
    id: 'user_guide',
    name: 'User Guide',
    description: 'End-user documentation — getting started, features, FAQs.',
    icon: '📖',
    audience: 'End users, customers, non-technical stakeholders',
    sections: [
      { id: 'intro', title: 'Introduction', order: 1 },
      { id: 'getting-started', title: 'Getting Started', order: 2 },
      { id: 'features', title: 'Features & Capabilities', order: 3 },
      { id: 'how-to', title: 'How-to Guides', order: 4 },
      { id: 'troubleshooting', title: 'Troubleshooting', order: 5 },
      { id: 'faq', title: 'FAQ', order: 6 },
    ],
    questions: [
      { id: 'q1', section: 'intro', question: 'What is your product and what problem does it solve?', hint: 'Write this for a non-technical user — plain language only', input_type: 'text', required: true },
      { id: 'q2', section: 'getting-started', question: 'What are the steps to get started with your product?', hint: 'Sign up, install, configure, first action — step by step', input_type: 'text', required: true },
      { id: 'q3', section: 'features', question: 'What are the main features users need to know about?', hint: 'One feature per line — we\'ll expand each into a guide', input_type: 'list', required: true },
      { id: 'q4', section: 'how-to', question: 'What are the most common tasks users need to do?', hint: 'e.g. Create a project, invite a team member, export data', input_type: 'list', required: true },
      { id: 'q5', section: 'troubleshooting', question: 'What are the most common issues users run into?', hint: 'e.g. Can\'t log in, data not syncing, slow performance', input_type: 'list', required: false },
      { id: 'q6', section: 'faq', question: 'What questions do users frequently ask?', hint: 'List question + answer pairs', input_type: 'text', required: false },
    ],
    repoQuestions: [
      { id: 'rq1', section: 'intro', question: 'What is the primary audience for this product?', hint: 'e.g. developers, small business owners, security teams', input_type: 'text', required: true },
    ],
  },

  // ── API DOCS ────────────────────────────────────────────────────
  {
    id: 'api_docs',
    name: 'API & Webhook Docs',
    description: 'Complete developer reference — endpoints, authentication, webhooks, SDKs.',
    icon: '⚡',
    audience: 'Developers, technical integrators',
    sections: [
      { id: 'overview', title: 'API Overview', order: 1 },
      { id: 'auth', title: 'Authentication', order: 2 },
      { id: 'endpoints', title: 'Endpoints Reference', order: 3 },
      { id: 'webhooks', title: 'Webhooks', order: 4 },
      { id: 'sdks', title: 'SDKs & Libraries', order: 5 },
      { id: 'errors', title: 'Error Reference', order: 6 },
      { id: 'rate-limits', title: 'Rate Limits & Quotas', order: 7 },
      { id: 'changelog', title: 'Changelog', order: 8 },
    ],
    questions: [
      { id: 'q1', section: 'overview', question: 'What does your API do? Who is it for?', hint: 'High-level purpose, use cases, typical integrations', input_type: 'text', required: true },
      { id: 'q2', section: 'auth', question: 'How does authentication work?', hint: 'API keys, OAuth 2.0, JWT, session tokens — include header format', input_type: 'text', required: true },
      { id: 'q3', section: 'endpoints', question: 'List your API endpoints with method, path, description and parameters.', hint: 'e.g. POST /v1/users — creates a user. Body: {email, name}', input_type: 'text', required: true },
      { id: 'q4', section: 'endpoints', question: 'Paste example request/response JSON for your key endpoints.', hint: 'Real examples are the most valuable part of API docs', input_type: 'code', required: true },
      { id: 'q5', section: 'webhooks', question: 'Does your API send webhooks? Describe the events and payload format.', hint: 'e.g. payment.completed, user.created — include sample payload', input_type: 'text', required: false },
      { id: 'q6', section: 'errors', question: 'What error codes and messages does your API return?', hint: 'HTTP status codes + your custom error codes and what they mean', input_type: 'text', required: true },
      { id: 'q7', section: 'rate-limits', question: 'What are your rate limits?', hint: 'Requests per minute/hour, how communicated (headers?), backoff strategy', input_type: 'text', required: false },
      { id: 'q8', section: 'sdks', question: 'Do you have official SDKs or client libraries?', hint: 'Languages, npm/pip package names, GitHub links', input_type: 'text', required: false },
    ],
    repoQuestions: [
      { id: 'rq1', section: 'overview', question: 'What is the base URL of your API?', hint: 'e.g. https://api.yourproduct.com/v1', input_type: 'url', required: true },
      { id: 'rq2', section: 'overview', question: 'What version is the API currently on?', hint: 'e.g. v1, v2.3, 2024-01', input_type: 'text', required: false },
    ],
  },

  // ── WHITEPAPER ──────────────────────────────────────────────────
  {
    id: 'whitepaper',
    name: 'Whitepaper',
    description: 'Technical whitepaper for crypto, web3, or research-driven projects.',
    icon: '📜',
    audience: 'Investors, developers, technical community, regulators',
    sections: [
      { id: 'abstract', title: 'Abstract', order: 1 },
      { id: 'introduction', title: 'Introduction & Problem Statement', order: 2 },
      { id: 'solution', title: 'Proposed Solution', order: 3 },
      { id: 'architecture', title: 'Technical Architecture', order: 4 },
      { id: 'tokenomics', title: 'Tokenomics & Economics', order: 5 },
      { id: 'governance', title: 'Governance', order: 6 },
      { id: 'roadmap', title: 'Roadmap', order: 7 },
      { id: 'team', title: 'Team', order: 8 },
      { id: 'legal', title: 'Legal Disclaimer', order: 9 },
    ],
    questions: [
      { id: 'q1', section: 'abstract', question: 'Describe your project in 3–5 sentences for a technical audience.', hint: 'What it is, what problem it solves, what makes it unique', input_type: 'text', required: true },
      { id: 'q2', section: 'introduction', question: 'What is the core problem you are solving?', hint: 'Be specific about the market failure or technical gap', input_type: 'text', required: true },
      { id: 'q3', section: 'solution', question: 'How does your solution work at a high level?', hint: 'Non-technical overview before the deep tech section', input_type: 'text', required: true },
      { id: 'q4', section: 'architecture', question: 'Describe the technical architecture in detail.', hint: 'Consensus mechanism, smart contract structure, network topology, security model', input_type: 'text', required: true },
      { id: 'q5', section: 'tokenomics', question: 'Describe your tokenomics.', hint: 'Token name/symbol, total supply, distribution (team/investors/community/reserve), vesting schedules, utility', input_type: 'text', required: false },
      { id: 'q6', section: 'governance', question: 'How is the protocol governed?', hint: 'DAO structure, voting mechanism, proposal process, quorum requirements', input_type: 'text', required: false },
      { id: 'q7', section: 'roadmap', question: 'What is your roadmap?', hint: 'Past milestones + upcoming phases with estimated timelines', input_type: 'text', required: true },
      { id: 'q8', section: 'team', question: 'Who is on the team?', hint: 'Names, roles, relevant backgrounds — or "team is anonymous" if applicable', input_type: 'text', required: false },
    ],
    repoQuestions: [
      { id: 'rq1', section: 'architecture', question: 'What blockchain or consensus mechanism does your project use?', hint: 'e.g. Ethereum L2, Solana, custom PoS, Cosmos SDK', input_type: 'text', required: true },
      { id: 'rq2', section: 'architecture', question: 'What programming language are your smart contracts written in?', hint: 'e.g. Solidity, Rust, Move, Cairo', input_type: 'text', required: false },
    ],
  },

  // ── AUDIT REPORT ────────────────────────────────────────────────
  {
    id: 'audit_report',
    name: 'Audit Report',
    description: 'Security or compliance audit report for smart contracts, APIs or systems.',
    icon: '🔍',
    audience: 'Clients, investors, compliance teams, public disclosure',
    sections: [
      { id: 'exec-summary', title: 'Executive Summary', order: 1 },
      { id: 'scope', title: 'Scope & Methodology', order: 2 },
      { id: 'findings', title: 'Findings', order: 3 },
      { id: 'critical', title: 'Critical & High Severity Issues', order: 4 },
      { id: 'medium-low', title: 'Medium & Low Severity Issues', order: 5 },
      { id: 'remediation', title: 'Remediation Summary', order: 6 },
      { id: 'conclusion', title: 'Conclusion', order: 7 },
    ],
    questions: [
      { id: 'q1', section: 'exec-summary', question: 'What was audited and by whom?', hint: 'Project name, version, audit firm or individual, dates', input_type: 'text', required: true },
      { id: 'q2', section: 'scope', question: 'What was in scope for this audit?', hint: 'Specific contracts, files, API endpoints, commit hash', input_type: 'text', required: true },
      { id: 'q3', section: 'scope', question: 'What methodology was used?', hint: 'e.g. Manual review, automated analysis (Slither, MythX), formal verification', input_type: 'text', required: true },
      { id: 'q4', section: 'findings', question: 'List all findings. For each: title, severity, description, affected code, recommendation.', hint: 'Be precise — include line numbers or function names where possible', input_type: 'text', required: true },
      { id: 'q5', section: 'remediation', question: 'What is the remediation status of each finding?', hint: 'Fixed / Acknowledged / Won\'t fix — with brief explanation', input_type: 'text', required: true },
      { id: 'q6', section: 'conclusion', question: 'What is your overall security assessment?', hint: 'Is the codebase safe to deploy? What risk remains?', input_type: 'text', required: true },
    ],
    repoQuestions: [
      { id: 'rq1', section: 'scope', question: 'What is the commit hash or tag being audited?', hint: 'e.g. abc1234 or v1.2.0 — important for reproducibility', input_type: 'text', required: false },
    ],
  },

  // ── FULL SUITE ──────────────────────────────────────────────────
  {
    id: 'full_suite',
    name: 'Full Documentation Suite',
    description: 'Complete package — user guide, API docs, and technical overview in one.',
    icon: '📦',
    audience: 'All audiences — customers, developers, investors',
    sections: [
      { id: 'overview', title: 'Product Overview', order: 1 },
      { id: 'getting-started', title: 'Getting Started', order: 2 },
      { id: 'features', title: 'Features', order: 3 },
      { id: 'api-overview', title: 'API Overview', order: 4 },
      { id: 'auth', title: 'Authentication', order: 5 },
      { id: 'endpoints', title: 'Key Endpoints', order: 6 },
      { id: 'webhooks', title: 'Webhooks', order: 7 },
      { id: 'errors', title: 'Error Handling', order: 8 },
      { id: 'faq', title: 'FAQ', order: 9 },
      { id: 'changelog', title: 'Changelog', order: 10 },
    ],
    questions: [
      { id: 'q1', section: 'overview', question: 'What is your product and what does it do?', hint: 'Plain English — one paragraph for any audience', input_type: 'text', required: true },
      { id: 'q2', section: 'getting-started', question: 'How does a new user or developer get started?', hint: 'Sign up → install → first API call or first action', input_type: 'text', required: true },
      { id: 'q3', section: 'features', question: 'What are the core features?', hint: 'One per line — both user-facing and developer-facing', input_type: 'list', required: true },
      { id: 'q4', section: 'auth', question: 'How does authentication work?', hint: 'API keys, OAuth, JWT — include header examples', input_type: 'text', required: true },
      { id: 'q5', section: 'endpoints', question: 'List your most important API endpoints.', hint: 'Method + path + description + example', input_type: 'text', required: true },
      { id: 'q6', section: 'webhooks', question: 'What webhooks do you send and what do the payloads look like?', hint: 'Event name + sample JSON payload', input_type: 'code', required: false },
      { id: 'q7', section: 'errors', question: 'What error codes and messages should developers know?', hint: 'HTTP status + custom error codes', input_type: 'text', required: true },
      { id: 'q8', section: 'faq', question: 'What do users and developers frequently ask?', hint: 'List question + short answer pairs', input_type: 'text', required: false },
    ],
    repoQuestions: [
      { id: 'rq1', section: 'api-overview', question: 'What is the API base URL?', hint: 'e.g. https://api.yourproduct.com/v1', input_type: 'url', required: true },
      { id: 'rq2', section: 'overview', question: 'Who is the primary audience — end users, developers, or both?', hint: 'This shapes the tone and depth of the documentation', input_type: 'text', required: true },
    ],
  },
]

export function getCompanyTemplate(id: CompanyDocType): CompanyDocTemplate | undefined {
  return COMPANY_DOC_TEMPLATES.find(t => t.id === id)
}
