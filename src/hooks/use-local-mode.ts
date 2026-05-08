'use client'
import { useState, useEffect, useCallback } from 'react'

// Dexie-free implementation using IndexedDB directly via a simple wrapper
// Install dexie separately: npm install dexie
// Then swap this for the dexie version if preferred

interface LocalProject {
  id: string
  title: string
  career_track: string
  template_id: string
  design_theme: string
  content: Record<string, unknown>
  created_at: string
  updated_at: string
}

const STORE_KEY = 'portforge_local_v1'

function readStore(): LocalProject[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
  } catch { return [] }
}

function writeStore(projects: LocalProject[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORE_KEY, JSON.stringify(projects))
}

function uid() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useLocalMode() {
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [projects, setProjects] = useState<LocalProject[]>([])

  useEffect(() => {
    const mode = localStorage.getItem('portforge_mode') === 'local'
    setIsLocalMode(mode)
    if (mode) setProjects(readStore())
  }, [])

  const toggleLocalMode = useCallback((enabled: boolean) => {
    localStorage.setItem('portforge_mode', enabled ? 'local' : 'cloud')
    setIsLocalMode(enabled)
    if (enabled) setProjects(readStore())
  }, [])

  const createProject = useCallback((data: Omit<LocalProject, 'id' | 'created_at' | 'updated_at'>): LocalProject => {
    const project: LocalProject = {
      ...data, id: uid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [...readStore(), project]
    writeStore(updated); setProjects(updated)
    return project
  }, [])

  const updateProject = useCallback((id: string, updates: Partial<LocalProject>) => {
    const updated = readStore().map(p =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    )
    writeStore(updated); setProjects(updated)
  }, [])

  const deleteProject = useCallback((id: string) => {
    const updated = readStore().filter(p => p.id !== id)
    writeStore(updated); setProjects(updated)
  }, [])

  const exportMarkdown = useCallback((id: string) => {
    const project = readStore().find(p => p.id === id)
    if (!project) return
    const content = project.content as Record<string, unknown>
    const md = (content?.edited as string) || (content?.generated as string) || ''
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })),
      download: `${project.title.replace(/\s+/g, '-').toLowerCase()}.md`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }, [])

  const clearAll = useCallback(() => {
    writeStore([]); setProjects([])
  }, [])

  return { isLocalMode, toggleLocalMode, projects, createProject, updateProject, deleteProject, exportMarkdown, clearAll }
}
