import Dexie, { type Table } from 'dexie'
import type { Project, ProjectSection, LLMConfig, ExportRecord } from '@/types'

export class PortforgeDB extends Dexie {
  projects!: Table<Project, string>
  projectSections!: Table<ProjectSection, string>
  llmConfig!: Table<LLMConfig & { id: string }, string>
  exportHistory!: Table<ExportRecord, string>

  constructor() {
    super('portforge_db')
    this.version(1).stores({
      projects: 'id, title, template_id, status, updated_at',
      projectSections: 'id, project_id, section_id, order',
      llmConfig: 'id',
      exportHistory: 'id, project_id, format, created_at',
    })
  }
}

export const db = new PortforgeDB()

// Projects
export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updated_at').reverse().toArray()
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  const id = `pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()
  const project: Project = { ...data, id, created_at: now, updated_at: now }
  await db.projects.add(project)
  return project
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  await db.projects.update(id, { ...updates, updated_at: new Date().toISOString() })
}

export async function deleteProject(id: string): Promise<void> {
  await db.projectSections.where('project_id').equals(id).delete()
  await db.exportHistory.where('project_id').equals(id).delete()
  await db.projects.delete(id)
}

// Sections
export async function getProjectSections(projectId: string): Promise<ProjectSection[]> {
  return db.projectSections.where('project_id').equals(projectId).sortBy('order')
}

export async function saveSection(section: ProjectSection): Promise<void> {
  await db.projectSections.put(section)
}

// LLM Config
export async function getLLMConfig(): Promise<LLMConfig | null> {
  const config = await db.llmConfig.get('default')
  if (!config) return null
  const { ...rest } = config
  return rest
}

export async function saveLLMConfig(config: LLMConfig): Promise<void> {
  await db.llmConfig.put({ ...config, id: 'default' })
}

export async function clearLLMConfig(): Promise<void> {
  await db.llmConfig.delete('default')
}

// Export History
export async function addExportRecord(record: Omit<ExportRecord, 'id'>): Promise<void> {
  const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await db.exportHistory.add({ ...record, id })
}

export async function getExportHistory(projectId: string): Promise<ExportRecord[]> {
  return db.exportHistory.where('project_id').equals(projectId).reverse().toArray()
}
