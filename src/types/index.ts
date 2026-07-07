export type CareerTrack = 'cybersecurity'
export type DocumentationMode = 'static' | 'integrative'
export type ProjectStatus = 'draft' | 'complete' | 'exported'
export type InputType = 'text' | 'code' | 'image' | 'file' | 'list' | 'cvss-table'

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'nvidia'
  | 'groq'
  | 'moonshot'
  | 'z-ai'
  | 'minimax'

export interface LLMConfig {
  provider: LLMProvider
  model: string
  apiKey: string
  customEndpoint?: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  career_track: CareerTrack | null
  documentation_mode: DocumentationMode
  bio: string | null
  created_at: string
}

export interface Project {
  id: string
  title: string
  career_track: CareerTrack
  template_id: string
  design_theme: string
  status: ProjectStatus
  public: boolean
  content: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProjectSection {
  id: string
  project_id: string
  section_id: string
  title: string
  content: string
  order: number
  created_at: string
  updated_at: string
}

export interface ExportRecord {
  id: string
  project_id: string
  format: 'pdf' | 'markdown' | 'html'
  filename: string
  created_at: string
}

export interface QuestionSchema {
  id: string
  section: string
  question: string
  hint: string
  input_type: InputType
  required: boolean
}

export interface OutputSection {
  id: string
  title: string
  order: number
}

export interface Template {
  id: string
  career_track: CareerTrack
  name: string
  description: string
  question_schema: QuestionSchema[]
  output_structure: OutputSection[]
}

export interface DesignTheme {
  id: string
  career_track: CareerTrack
  name: string
  description: string
  preview_colors: string[]
}

export interface CVSSFinding {
  id: string
  name: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None'
  cvssScore: number
  cvssVector: string
  impact: string
  remediation: string
}

export interface CVSSMetrics {
  AV: 'N' | 'A' | 'L' | 'P'
  AC: 'L' | 'H'
  PR: 'N' | 'L' | 'H'
  UI: 'N' | 'R'
  S: 'U' | 'C'
  C: 'N' | 'L' | 'H'
  I: 'N' | 'L' | 'H'
  A: 'N' | 'L' | 'H'
}

export const FREE_TIER_LIMIT = 2
