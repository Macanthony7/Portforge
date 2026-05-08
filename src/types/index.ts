export type CareerTrack = 'cybersecurity' | 'software_dev' | 'devops_cloud'
export type DocumentationMode = 'static' | 'integrative'
export type ProjectStatus = 'draft' | 'complete' | 'exported'
export type SubscriptionTier = 'free' | 'pro' | 'audit'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  career_track: CareerTrack | null
  documentation_mode: DocumentationMode
  subscription_tier: SubscriptionTier
  portfolio_public: boolean
  bio: string | null
  created_at: string
}

export interface Project {
  id: string
  user_id: string
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

export interface QuestionSchema {
  id: string
  section: string
  question: string
  hint: string
  input_type: 'text' | 'code' | 'image' | 'file' | 'list'
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

export const FREE_TIER_LIMIT = 2
